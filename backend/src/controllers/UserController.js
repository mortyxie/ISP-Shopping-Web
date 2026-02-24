/**
 * 用户控制器 - 登入登出注册功能具体实现
 */

const db = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middlewares/authMiddleware');

/**
 * 用户登入
 * POST /api/login
 */
const login = (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证必填字段
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 查找用户
        const user = db.findBy('users', { username })[0];

        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 不返回密码
        const { password: _, ...userWithoutPassword } = user;

        // 生成token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role
        });

        const refreshToken = generateRefreshToken({
            userId: user.id
        });

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: userWithoutPassword,
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 用户登出
 * POST /api/logout/:user_id
 */
const logout = (req, res) => {
    try {
        const { user_id } = req.params;

        // 在实际应用中，这里应该将token加入黑名单
        // 由于是内存数据库，我们只是返回成功
        res.json({
            success: true,
            message: '登出成功'
        });
    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 新用户注册
 * POST /api/register
 */
const register = (req, res) => {
    try {
        const { username, password, name, email, phone, role } = req.body;

        // 验证必填字段
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const existingUser = db.findBy('users', { username })[0];
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 创建新用户
        const newUser = db.insert('users', {
            username,
            password, // 实际应用中应该加密存储
            name: name || username,
            email: email || null,
            phone: phone || null,
            role: role || 'user',
            avatar: null
        });

        // 不返回密码
        const { password: _, ...userWithoutPassword } = newUser;

        // 生成token
        const token = generateToken({
            userId: newUser.id,
            username: newUser.username,
            role: newUser.role
        });

        const refreshToken = generateRefreshToken({
            userId: newUser.id
        });

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: userWithoutPassword,
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 获取当前用户信息
 * GET /api/user/me
 */
const getCurrentUser = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const user = db.findById('users', req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

module.exports = {
    login,
    logout,
    register,
    getCurrentUser
};
