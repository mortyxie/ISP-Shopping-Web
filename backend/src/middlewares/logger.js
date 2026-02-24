/**
 * 日志记录中间件
 * 记录API请求和响应信息
 */

const fs = require('fs');
const path = require('path');

/**
 * 请求日志记录器
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 记录原始的res.json和res.end方法
    const originalJson = res.json;
    const originalEnd = res.end;

    // 记录响应数据
    let responseData = null;
    res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
    };

    // 重写res.end以记录响应时间
    res.end = function(chunk, encoding) {
        const duration = Date.now() - startTime;

        const logData = {
            timestamp,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestBody: req.method !== 'GET' ? maskSensitiveData(req.body) : undefined,
            responseData: responseData ? maskSensitiveData(responseData) : undefined
        };

        // 控制台输出（开发环境）
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        }

        // 记录到日志文件
        if (process.env.ENABLE_REQUEST_LOG === 'true') {
            writeLog('requests', logData);
        }

        originalEnd.call(this, chunk, encoding);
    };

    next();
};

/**
 * 敏感数据遮蔽
 * 防止密码等敏感信息被记录
 */
const maskSensitiveData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];

    for (const key of Object.keys(masked)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            masked[key] = '***MASKED***';
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitiveData(masked[key]);
        }
    }

    return masked;
};

/**
 * 写入日志到文件
 * @param {string} type - 日志类型
 * @param {Object} data - 日志数据
 */
const writeLog = (type, data) => {
    try {
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `${type}-${date}.log`);
        const logEntry = JSON.stringify(data) + '\n';

        fs.appendFileSync(logFile, logEntry, 'utf8');
    } catch (error) {
        console.error('写入日志失败:', error);
    }
};

/**
 * 错误日志记录器
 */
const errorLogger = (err, req, res, next) => {
    const logData = {
        timestamp: new Date().toISOString(),
        error: {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            body: maskSensitiveData(req.body),
            query: req.query,
            params: req.params
        }
    };

    console.error('ERROR:', logData);
    writeLog('errors', logData);
    next(err);
};

/**
 * 用户活动日志记录器
 */
const activityLogger = (activityType) => {
    return (req, res, next) => {
        const originalJson = res.json;
        const originalEnd = res.end;
        let isSuccess = false;

        res.json = function(data) {
            isSuccess = res.statusCode < 400;
            return originalJson.call(this, data);
        };

        res.end = function(...args) {
            if (isSuccess) {
                const logData = {
                    timestamp: new Date().toISOString(),
                    activityType,
                    userId: req.user?.userId,
                    username: req.user?.username,
                    method: req.method,
                    url: req.originalUrl,
                    ip: req.ip
                };
                writeLog('activities', logData);
            }
            return originalEnd.apply(this, args);
        };

        next();
    };
};

/**
 * 访问日志中间件（简化版）
 */
const accessLog = (req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const method = req.method.padEnd(6);
    const url = req.originalUrl;
    const status = res.statusCode;

    console.log(`[${timestamp}] ${method} ${url} - ${status}`);
    next();
};

/**
 * 请求追踪中间件
 * 为每个请求添加唯一ID
 */
const requestTracer = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] ||
                    req.headers['request-id'] ||
                    generateRequestId();

    res.setHeader('X-Request-ID', req.requestId);

    const originalJson = res.json;
    res.json = function(data) {
        if (typeof data === 'object') {
            data.requestId = req.requestId;
        }
        return originalJson.call(this, data);
    };

    next();
};

/**
 * 生成请求ID
 */
const generateRequestId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

/**
 * 性能监控中间件
 */
const performanceMonitor = (threshold = 1000) => {
    return (req, res, next) => {
        const startTime = process.hrtime();

        res.on('finish', () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const duration = seconds * 1000 + nanoseconds / 1000000;

            if (duration > threshold) {
                console.warn(`Slow Request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
                writeLog('performance', {
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    url: req.originalUrl,
                    duration: `${duration.toFixed(2)}ms`
                });
            }
        });

        next();
    };
};

/**
 * 统计中间件
 * 记录API调用统计
 */
const statsLogger = () => {
    const stats = {
        totalRequests: 0,
        requestsByPath: {},
        requestsByStatus: {},
        requestsByMethod: {}
    };

    return (req, res, next) => {
        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const path = req.route?.path || req.path;

            stats.totalRequests++;

            // 按路径统计
            if (!stats.requestsByPath[path]) {
                stats.requestsByPath[path] = { count: 0, totalTime: 0 };
            }
            stats.requestsByPath[path].count++;
            stats.requestsByPath[path].totalTime += duration;

            // 按状态码统计
            const status = res.statusCode;
            if (!stats.requestsByStatus[status]) {
                stats.requestsByStatus[status] = 0;
            }
            stats.requestsByStatus[status]++;

            // 按方法统计
            const method = req.method;
            if (!stats.requestsByMethod[method]) {
                stats.requestsByMethod[method] = 0;
            }
            stats.requestsByMethod[method]++;
        });

        // 将统计信息附加到app以便访问
        req.app.locals.stats = stats;
        next();
    };
};

module.exports = {
    requestLogger,
    errorLogger,
    activityLogger,
    accessLog,
    requestTracer,
    performanceMonitor,
    statsLogger,
    maskSensitiveData,
    writeLog
};
