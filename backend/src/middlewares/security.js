/**
 * 安全头部中间件
 * 设置各种安全相关的HTTP头部
 */

/**
 * 安全头部中间件
 * 设置常见的安全HTTP头部
 */
const securityHeaders = (req, res, next) => {
    // 防止MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');

    // 启用浏览器的XSS过滤器
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 内容安全策略
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';"
    );

    // 严格传输安全（仅HTTPS）
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // 引用者策略
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 权限策略
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
};

/**
 * CORS中间件工厂
 * @param {Object} options - CORS配置
 */
const cors = (options = {}) => {
    const defaults = {
        origin: '*',  // 允许所有来源
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: [],
        credentials: false,
        maxAge: 86400  // 预检请求缓存24小时
    };

    const config = { ...defaults, ...options };

    return (req, res, next) => {
        // 处理预检请求
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', config.origin);
            res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
            res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
            res.setHeader('Access-Control-Max-Age', config.maxAge);

            if (config.credentials) {
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }

            if (config.exposedHeaders.length > 0) {
                res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
            }

            return res.status(204).end();
        }

        // 处理常规请求
        res.setHeader('Access-Control-Allow-Origin', config.origin);

        if (config.credentials) {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        if (config.exposedHeaders.length > 0) {
            res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
        }

        next();
    };
};

/**
 * 源白名单CORS
 * @param {Array<string>} allowedOrigins - 允许的源列表
 */
const corsWhitelist = (allowedOrigins = []) => {
    return (req, res, next) => {
        const origin = req.headers.origin;

        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    };
};

/**
 * Body大小限制中间件
 * @param {number} maxSize - 最大大小（字节）
 */
const bodySizeLimit = (maxSize = 10 * 1024 * 1024) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'], 10);

        if (contentLength > maxSize) {
            return res.status(413).json({
                success: false,
                message: `请求体过大，最大允许 ${maxSize / 1024 / 1024}MB`
            });
        }

        next();
    };
};

/**
 * SQL注入防护中间件
 * 检测常见的SQL注入模式
 */
const sqlInjectionProtection = (req, res, next) => {
    const patterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /(\;)/i,
        /(exec(\s|\+)+(s|x)p\w+)/i,
        /(union(\s|\+)+(select|all|distinct))/i,
        /(insert(\s|\+)+into)/i,
        /(delete(\s|\+)+from)/i,
        /(update(\s|\+)+\w+\s+set)/i,
        /(drop(\s|\+)+(table|database))/i,
        /(create(\s|\+)+(table|database))/i
    ];

    const checkValue = (value) => {
        if (typeof value !== 'string') return false;
        return patterns.some(pattern => pattern.test(value));
    };

    const checkObject = (obj) => {
        for (const key of Object.keys(obj)) {
            if (checkValue(obj[key])) return true;
        }
        return false;
    };

    if (checkObject(req.query) || checkObject(req.body) || checkObject(req.params)) {
        return res.status(400).json({
            success: false,
            message: '检测到可疑请求，已被拒绝'
        });
    }

    next();
};

/**
 * XSS防护中间件
 * 转义HTML特殊字符
 */
const xssProtection = (req, res, next) => {
    const escapeHtml = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                if (typeof obj[i] === 'string') {
                    obj[i] = escapeHtml(obj[i]);
                } else if (typeof obj[i] === 'object') {
                    sanitizeObject(obj[i]);
                }
            }
            return obj;
        }

        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string') {
                obj[key] = escapeHtml(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        }
        return obj;
    };

    // 清理查询参数
    sanitizeObject(req.query);

    // 清理请求体
    sanitizeObject(req.body);

    next();
};

/**
 * 路径遍历防护中间件
 */
const pathTraversalProtection = (req, res, next) => {
    const maliciousPatterns = [
        /\.\.[\/\\]/,        // ../ or ..\
        /%2e%2e[\/\\]/i,     // URL编码的 ../
        /%252e%252e[\/\\]/i, // 双重URL编码的 ../
    ];

    const checkPath = (path) => {
        if (!path || typeof path !== 'string') return false;
        return maliciousPatterns.some(pattern => pattern.test(path));
    };

    if (checkPath(req.path) || checkPath(req.url)) {
        return res.status(400).json({
            success: false,
            message: '检测到路径遍历攻击，已被拒绝'
        });
    }

    next();
};

/**
 * 请求方法验证中间件
 * 确保HTTP方法被允许
 */
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const methodValidator = (req, res, next) => {
    if (!allowedMethods.includes(req.method.toUpperCase())) {
        return res.status(405).json({
            success: false,
            message: `不支持的HTTP方法: ${req.method}`
        });
    }

    next();
};

/**
 * 请求体类型验证中间件
 */
const contentTypeValidator = (req, res, next) => {
    // 对POST、PUT、PATCH请求验证Content-Type
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];

        // 如果有请求体但没有Content-Type头
        if (req.headers['content-length'] && req.headers['content-length'] > 0) {
            if (!contentType) {
                return res.status(400).json({
                    success: false,
                    message: '请求缺少Content-Type头'
                });
            }

            const allowedTypes = [
                'application/json',
                'multipart/form-data',
                'application/x-www-form-urlencoded'
            ];

            const isAllowed = allowedTypes.some(type => contentType.startsWith(type));
            if (!isAllowed) {
                return res.status(400).json({
                    success: false,
                    message: `不支持的Content-Type: ${contentType}`
                });
            }
        }
    }

    next();
};

/**
 * 主机头验证中间件
 */
const hostValidator = (allowedHosts = []) => {
    return (req, res, next) => {
        const host = req.headers.host;

        if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
            return res.status(400).json({
                success: false,
                message: '无效的主机头'
            });
        }

        next();
    };
};

/**
 * 安全路由配置
 */
const securityConfig = {
    headers: securityHeaders,
    cors: cors,
    corsWhitelist: corsWhitelist,
    bodySizeLimit: bodySizeLimit,
    sqlInjectionProtection: sqlInjectionProtection,
    xssProtection: xssProtection,
    pathTraversalProtection: pathTraversalProtection,
    methodValidator: methodValidator,
    contentTypeValidator: contentTypeValidator,
    hostValidator: hostValidator
};

module.exports = securityConfig;
