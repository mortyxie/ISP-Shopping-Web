//用于测试用户是否登入的中间件

const jwt = require('jsonwebtoken');

// JWT密钥（生产环境应该从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 验证用户是否登录的中间件
 * 从请求头的Authorization字段获取Bearer Token
 */
const test = (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌，请先登录'
            });
        }

        // 提取Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌格式'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌格式'
            });
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 将用户信息附加到请求对象
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期，请重新登录'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: '认证过程中发生错误'
            });
        }
    }
};

/**
 * 可选认证中间件 - 如果有token则验证，没有则继续
 */
const optionalTest = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        // 可选认证失败不阻止请求
        next();
    }
};

module.exports = {
    test,
    optionalTest,
    JWT_SECRET
};
