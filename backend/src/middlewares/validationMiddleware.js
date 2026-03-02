/**
 * 请求验证中间件
 * 用于验证和清理请求参数
 */

/**
 * 验证请求体中间件工厂
 * @param {Object} schema - 验证规则对象
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field];

            // 检查必填字段
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field,
                    message: `${field} 为必填项`
                });
                continue;
            }

            // 如果字段不存在且非必填，跳过验证
            if (value === undefined || value === null) {
                continue;
            }

            // 类型验证
            if (rules.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== rules.type && actualType !== rules.type.toLowerCase()) {
                    errors.push({
                        field,
                        message: `${field} 应为 ${rules.type} 类型`
                    });
                }
            }

            // 字符串长度验证
            if (rules.type === 'string' && typeof value === 'string') {
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push({
                        field,
                        message: `${field} 长度不能少于 ${rules.minLength} 个字符`
                    });
                }
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push({
                        field,
                        message: `${field} 长度不能超过 ${rules.maxLength} 个字符`
                    });
                }
            }

            // 数字范围验证
            if (rules.type === 'number' && typeof value === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    errors.push({
                        field,
                        message: `${field} 不能小于 ${rules.min}`
                    });
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push({
                        field,
                        message: `${field} 不能大于 ${rules.max}`
                    });
                }
            }

            // 枚举值验证
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push({
                    field,
                    message: `${field} 必须是以下值之一: ${rules.enum.join(', ')}`
                });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '请求数据验证失败',
                errors
            });
        }

        next();
    };
};

/**
 * 简化版分页参数验证中间件
 */
const validatePagination = (req, res, next) => {
    const page = req.query.page !== undefined ? parseInt(req.query.page) : 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;

    if (isNaN(page) || page < 1) {
        return res.status(400).json({
            success: false,
            message: '页码必须大于0'
        });
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            success: false,
            message: '每页数量必须在1-100之间'
        });
    }

    req.pagination = {
        page,
        limit,
        skip: (page - 1) * limit
    };

    next();
};

export {
    validateBody,
    validatePagination
};
