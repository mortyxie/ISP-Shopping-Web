/**
 * 日志记录中间件
 * 记录API请求和响应信息
 */

import fs from 'fs';
import path from 'path';

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
 * 简化版日志中间件
 */
const logger = (req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const method = req.method.padEnd(6);
    const url = req.originalUrl;
    const status = res.statusCode;

    console.log(`[${timestamp}] ${method} ${url} - ${status}`);
    next();
};

/**
 * 速率限制中间件
 */
const rateLimiter = (req, res, next) => {
    next();
};

export {
    requestLogger,
    errorLogger,
    logger,
    rateLimiter,
    maskSensitiveData,
    writeLog
};
