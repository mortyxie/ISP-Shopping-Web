//测试登入用户是否为卖家的中间件

/**
 * 验证用户是否为卖主/管理员的中间件
 * 需要先通过testLogin中间件验证身份
 */
const test = (req, res, next) => {
    try {
        // 检查用户是否已通过认证
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证，请先登录'
            });
        }

        // 检查用户角色是否为卖主或管理员
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '权限不足，仅卖主或管理员可访问此功能'
            });
        }

        // 将管理员标识附加到请求对象
        req.isAdmin = req.user.role === 'admin';
        req.isManager = true;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '权限验证过程中发生错误'
        });
    }
};

/**
 * 验证用户是否为超级管理员
 */
const testAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证，请先登录'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '权限不足，仅超级管理员可访问此功能'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '权限验证过程中发生错误'
        });
    }
};

/**
 * 检查资源所有权 - 验证用户是否有权访问特定资源
 * @param {string} resourceOwnerId - 资源所有者ID
 */
const checkOwnership = (resourceOwnerId) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '未认证，请先登录'
                });
            }

            // 管理员可以访问所有资源
            if (req.user.role === 'admin') {
                return next();
            }

            // 如果params中指定了user_id，检查用户的userId是否与params.user_id匹配
            // 否则检查用户的userId是否与resourceOwnerId匹配
            if (req.params.user_id) {
                // params.user_id 存在时，检查用户ID是否匹配params.user_id
                if (req.user.userId !== req.params.user_id) {
                    return res.status(403).json({
                        success: false,
                        message: '无权访问此资源'
                    });
                }
            } else {
                // params.user_id 不存在时，检查用户ID是否匹配resourceOwnerId
                if (req.user.userId !== resourceOwnerId) {
                    return res.status(403).json({
                        success: false,
                        message: '无权访问此资源'
                    });
                }
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '所有权验证过程中发生错误'
            });
        }
    };
};

module.exports = {
    test,
    testAdmin,
    checkOwnership
};
