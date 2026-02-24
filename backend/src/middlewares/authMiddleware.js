/**
 * 通用认证中间件
 * 提供各种认证和授权功能
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT Token
 * @param {Object} payload - 要编码的用户信息
 * @returns {string} JWT Token
 */
const generateToken = (payload) => {
    return jwt.sign(
        {
            userId: payload.userId,
            username: payload.username,
            role: payload.role || 'user'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * 生成刷新Token
 * @param {Object} payload - 要编码的用户信息
 * @returns {string} Refresh Token (有效期更长)
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        {
            userId: payload.userId,
            type: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

/**
 * 验证JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的用户信息
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw error;
    }
};

/**
 * 从请求中提取Token
 * @param {Object} req - Express请求对象
 * @returns {string|null} Token字符串
 */
const extractToken = (req) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // 也可以从查询参数中获取
    return req.query.token || req.body.token || null;
};

/**
 * 基础认证中间件
 */
const authenticate = (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const decoded = verifyToken(token);

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '令牌已过期',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({
            success: false,
            message: '无效的令牌'
        });
    }
};

/**
 * 可选认证中间件 - 有token则验证，没有则继续
 */
const optionalAuth = (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return next();
        }

        const decoded = verifyToken(token);

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        next();
    }
};

/**
 * 角色授权中间件工厂
 * @param {...string} allowedRoles - 允许的角色列表
 * @returns {Function} Express中间件
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
};

/**
 * API密钥认证中间件
 */
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: '缺少API密钥'
        });
    }

    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

    if (!validApiKeys.includes(apiKey)) {
        return res.status(403).json({
            success: false,
            message: '无效的API密钥'
        });
    }

    next();
};

/**
 * IP白名单中间件
 * @param {Array<string>} allowedIps - 允许的IP地址列表
 */
const ipWhitelist = (allowedIps) => {
    return (req, res, next) => {
        const clientIp = req.ip ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);

        if (!allowedIps.includes(clientIp) && !allowedIps.includes('*')) {
            return res.status(403).json({
                success: false,
                message: 'IP地址不在白名单中'
            });
        }

        next();
    };
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    extractToken,
    authenticate,
    optionalAuth,
    authorize,
    apiKeyAuth,
    ipWhitelist,
    JWT_SECRET
};
