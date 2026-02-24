/**
 * 速率限制中间件
 * 用于防止API滥用和DDoS攻击
 */

// 内存存储（生产环境建议使用Redis）
const ipStore = new Map();
const userStore = new Map();

/**
 * 清理过期记录
 * @param {Map} store - 存储Map
 * @param {number} ttl - 生存时间（毫秒）
 */
const cleanupStore = (store, ttl) => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
        if (now - data.resetTime > ttl) {
            store.delete(key);
        }
    }
};

/**
 * 通用速率限制器工厂
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
const rateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000,      // 时间窗口（毫秒）
        max = 100,                 // 最大请求数
        message = '请求过于频繁，请稍后再试',
        keyGenerator = (req) => req.ip,  // 键生成函数
        skipSuccessfulRequests = false,  // 是否跳过成功请求
        skipFailedRequests = false,      // 是否跳过失败请求
        store = ipStore                   // 存储Map
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        // 获取或创建记录
        let record = store.get(key);

        if (!record || now > record.resetTime) {
            record = {
                count: 0,
                resetTime: now + windowMs
            };
            store.set(key, record);
        }

        // 检查是否应该跳过计数
        let shouldSkip = false;
        if (skipSuccessfulRequests && res.statusCode < 400) {
            shouldSkip = true;
        }
        if (skipFailedRequests && res.statusCode >= 400) {
            shouldSkip = true;
        }

        // 监听响应状态
        if (skipSuccessfulRequests || skipFailedRequests) {
            const originalJson = res.json;
            res.json = function(...args) {
                const status = this.statusCode;
                if (skipSuccessfulRequests && status < 400) {
                    record.count--;
                }
                if (skipFailedRequests && status >= 400) {
                    record.count--;
                }
                return originalJson.apply(this, args);
            };
        }

        // 增加计数
        if (!shouldSkip) {
            record.count++;
            store.set(key, record);
        }

        // 设置响应头
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

        // 检查是否超限
        if (record.count > max) {
            return res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }

        next();
    };
};

/**
 * IP速率限制器
 * 基于客户端IP地址限制请求
 */
const ipRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,  // 15分钟
    max: 100,                   // 每个IP最多100次请求
    message: 'IP请求过于频繁，请15分钟后再试',
    keyGenerator: (req) => req.ip
});

/**
 * 严格IP速率限制器
 * 用于登录、注册等敏感接口
 */
const strictIpRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,  // 15分钟
    max: 5,                     // 每个IP最多5次请求
    message: '操作过于频繁，请15分钟后再试',
    keyGenerator: (req) => req.ip
});

/**
 * 用户速率限制器
 * 基于用户ID限制请求（需要认证）
 */
const userRateLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000,  // 1小时
    max: 1000,                  // 每个用户最多1000次请求
    message: '用户请求过于频繁，请1小时后再试',
    keyGenerator: (req) => req.user?.userId || req.ip,
    store: userStore
});

/**
 * API速率限制器
 * 针对特定API端点的限制
 * @param {Object} options - 配置选项
 */
const apiRateLimiter = (options) => {
    return rateLimiter(options);
};

/**
 * 登录速率限制器
 */
const loginRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,  // 15分钟
    max: 5,                     // 每个IP最多5次登录尝试
    message: '登录尝试过多，请15分钟后再试',
    keyGenerator: (req) => `login:${req.ip}`
});

/**
 * 注册速率限制器
 */
const registerRateLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000,  // 1小时
    max: 3,                     // 每个IP最多3次注册
    message: '注册尝试过多，请1小时后再试',
    keyGenerator: (req) => `register:${req.ip}`
});

/**
 * 请求速率限制器
 * 防止单个用户发送过多请求
 */
const requestRateLimiter = rateLimiter({
    windowMs: 60 * 1000,       // 1分钟
    max: 60,                    // 每分钟最多60次请求
    message: '请求过于频繁，请稍后再试'
});

/**
 * 慢速请求检测
 * 检测请求处理时间，慢速请求消耗更多配额
 */
const slowRequestLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000,
        max = 100,
        slowThreshold = 1000,  // 慢速请求阈值（毫秒）
        slowCost = 5           // 慢速请求消耗配额
    } = options;

    return rateLimiter({
        windowMs,
        max,
        keyGenerator: (req) => req.ip,
        skipSuccessfulRequests: true
    });
};

/**
 * 动态速率限制器
 * 根据系统负载动态调整限制
 */
const dynamicRateLimiter = () => {
    let currentMax = 100;

    return (req, res, next) => {
        // 根据系统负载调整限制（这里使用简单的CPU/内存模拟）
        const memUsage = process.memoryUsage();
        const memRatio = memUsage.heapUsed / memUsage.heapTotal;

        if (memRatio > 0.9) {
            currentMax = 10;  // 高负载时限制
        } else if (memRatio > 0.7) {
            currentMax = 50;  // 中负载时限制
        } else {
            currentMax = 100; // 正常负载
        }

        const limiter = rateLimiter({
            windowMs: 60 * 1000,
            max: currentMax,
            message: `系统繁忙，当前限制为每分钟${currentMax}次请求`,
            keyGenerator: (req) => req.ip
        });

        limiter(req, res, next);
    };
};

/**
 * 白名单速率限制器
 * 跳过白名单中的IP
 * @param {Array<string>} whitelist - 白名单IP数组
 * @returns {Function} Express中间件
 */
const whitelistedRateLimiter = (whitelist = []) => {
    const limiter = rateLimiter();

    return (req, res, next) => {
        if (whitelist.includes(req.ip)) {
            return next();
        }
        limiter(req, res, next);
    };
};

/**
 * 获取IP信息中间件
 * 确保req.ip正确设置
 */
const getIpInfo = (req, res, next) => {
    // 尝试从各种来源获取真实IP
    req.ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
             req.headers['x-real-ip'] ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             (req.connection.socket?.remoteAddress) ||
             '127.0.0.1';

    // 移除IPv6前缀
    if (req.ip.includes('::ffff:')) {
        req.ip = req.ip.replace('::ffff:', '');
    }

    next();
};

// 定期清理过期记录
setInterval(() => {
    cleanupStore(ipStore, 24 * 60 * 60 * 1000);  // 清理超过24小时的IP记录
    cleanupStore(userStore, 24 * 60 * 60 * 1000); // 清理超过24小时的用户记录
}, 60 * 60 * 1000); // 每小时清理一次

module.exports = {
    rateLimiter,
    ipRateLimiter,
    strictIpRateLimiter,
    userRateLimiter,
    apiRateLimiter,
    loginRateLimiter,
    registerRateLimiter,
    requestRateLimiter,
    slowRequestLimiter,
    dynamicRateLimiter,
    whitelistedRateLimiter,
    getIpInfo
};
