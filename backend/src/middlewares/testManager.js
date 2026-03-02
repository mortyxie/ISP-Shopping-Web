/**
 * 测试登录用户是否为卖家的中间件
 * 注意：此中间件已被 authMiddleware.js 中的 authorize 替代
 * 保留此文件仅用于向后兼容
 */

import { authenticate, authorize } from './authMiddleware.js';

// 导出测试中间件
export {
    test: authenticate,
    testAdmin: (req, res, next) => {
        authenticate(req, res, (err) => {
            if (err) return next(err);
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '未认证，请先登录'
                });
            }
            next();
        });
    },
    checkOwnership: (resourceOwnerId) => {
        return (req, res, next) => {
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
            // 检查权限
            if (req.params.user_id) {
                if (req.user.userId !== req.params.user_id) {
                    return res.status(403).json({
                        success: false,
                        message: '无权访问此资源'
                    });
                }
            } else {
                if (req.user.userId !== resourceOwnerId) {
                    return res.status(403).json({
                        success: false,
                        message: '无权访问此资源'
                    });
                }
            }
            next();
        };
    }
};
