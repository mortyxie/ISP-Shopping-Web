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

export {
    rateLimiter,
    ipRateLimiter,
    strictIpRateLimiter,
    userRateLimiter,
    loginRateLimiter,
    registerRateLimiter
};
