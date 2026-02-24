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

            // 数组验证
            if (rules.type === 'array' && Array.isArray(value)) {
                if (rules.minItems && value.length < rules.minItems) {
                    errors.push({
                        field,
                        message: `${field} 至少需要 ${rules.minItems} 项`
                    });
                }
                if (rules.maxItems && value.length > rules.maxItems) {
                    errors.push({
                        field,
                        message: `${field} 最多只能有 ${rules.maxItems} 项`
                    });
                }
            }

            // 正则表达式验证
            if (rules.pattern && typeof value === 'string') {
                if (!rules.pattern.test(value)) {
                    errors.push({
                        field,
                        message: rules.patternMessage || `${field} 格式不正确`
                    });
                }
            }

            // 自定义验证
            if (rules.validate && typeof rules.validate === 'function') {
                const result = rules.validate(value, req);
                if (result !== true) {
                    errors.push({
                        field,
                        message: result || `${field} 验证失败`
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
 * 验证查询参数中间件工厂
 * @param {Object} schema - 验证规则对象
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.query[field];

            // 如果字段不存在且非必填，跳过验证
            if (value === undefined || value === null) {
                if (rules.required) {
                    errors.push({
                        field,
                        message: `${field} 为必填项`
                    });
                }
                continue;
            }

            // 类型验证
            if (rules.type === 'number') {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                    errors.push({
                        field,
                        message: `${field} 必须是数字`
                    });
                } else {
                    req.query[field] = numValue;
                }
            }

            if (rules.type === 'boolean') {
                if (value !== 'true' && value !== 'false') {
                    errors.push({
                        field,
                        message: `${field} 必须是 true 或 false`
                    });
                } else {
                    req.query[field] = value === 'true';
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '查询参数验证失败',
                errors
            });
        }

        next();
    };
};

/**
 * 验证路径参数中间件工厂
 * @param {Object} schema - 验证规则对象
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.params[field];

            if (!value && rules.required) {
                errors.push({
                    field,
                    message: `${field} 参数缺失`
                });
                continue;
            }

            if (rules.type === 'number') {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                    errors.push({
                        field,
                        message: `${field} 必须是数字`
                    });
                } else {
                    req.params[field] = numValue;
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '路径参数验证失败',
                errors
            });
        }

        next();
    };
};

/**
 * 清理请求数据中间件
 * 去除字符串字段的首尾空格，移除未定义的字段
 */
const sanitize = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        return Object.keys(obj).reduce((acc, key) => {
            const value = obj[key];

            // 移除undefined和null
            if (value === undefined || value === null) {
                return acc;
            }

            // 去除字符串首尾空格
            if (typeof value === 'string') {
                acc[key] = value.trim();
            }
            // 递归处理嵌套对象
            else if (typeof value === 'object' && !Array.isArray(value)) {
                acc[key] = sanitizeObject(value);
            }
            // 保留数组和其他类型
            else {
                acc[key] = value;
            }

            return acc;
        }, {});
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

/**
 * 文件上传验证中间件
 * @param {Object} options - 配置选项
 */
const validateFileUpload = (options = {}) => {
    const {
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        maxSize = 5 * 1024 * 1024, // 默认5MB
        required = false
    } = options;

    return (req, res, next) => {
        const file = req.file || (req.files && req.files[0]);

        if (!file) {
            if (required) {
                return res.status(400).json({
                    success: false,
                    message: '请上传文件'
                });
            }
            return next();
        }

        // 检查文件类型
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `不支持的文件类型，仅支持: ${allowedTypes.join(', ')}`
            });
        }

        // 检查文件大小
        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: `文件大小不能超过 ${maxSize / 1024 / 1024}MB`
            });
        }

        next();
    };
};

/**
 * 常用验证规则
 */
const validationRules = {
    // 邮箱验证
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // 用户名验证（字母、数字、下划线，4-20字符）
    username: /^[a-zA-Z0-9_]{4,20}$/,

    // 密码验证（至少8位，包含字母和数字）
    password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,

    // 手机号验证（中国大陆）
    phone: /^1[3-9]\d{9}$/,

    // URL验证
    url: /^https?:\/\/.+/,

    // 价格验证
    price: /^\d+(\.\d{1,2})?$/,

    // 数量验证
    quantity: /^[1-9]\d*$/
};

/**
 * ID验证中间件
 */
const validateId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!id) {
            return res.status(400).json({
                success: false,
                message: `${paramName} 参数缺失`
            });
        }

        // MongoDB ObjectId 验证
        if (typeof id === 'string') {
            const objectIdPattern = /^[0-9a-fA-F]{24}$/;
            if (!objectIdPattern.test(id)) {
                return res.status(400).json({
                    success: false,
                    message: `无效的 ${paramName} 格式`
                });
            }
        }

        next();
    };
};

/**
 * 分页参数验证中间件
 */
const validatePagination = (req, res, next) => {
    const page = req.query.page !== undefined ? parseInt(req.query.page) : 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

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
        skip: (page - 1) * limit,
        sortBy,
        sortOrder
    };

    next();
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams,
    sanitize,
    validateFileUpload,
    validateId,
    validatePagination,
    validationRules
};
