/**
 * 错误处理中间件
 * 统一处理应用中的错误
 */

/**
 * 自定义错误类
 */
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 验证错误类
 */
class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

/**
 * 未找到错误类
 */
class NotFoundError extends AppError {
    constructor(message = '资源未找到') {
        super(message, 404, 'NOT_FOUND');
    }
}

/**
 * 未授权错误类
 */
class UnauthorizedError extends AppError {
    constructor(message = '未授权访问') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

/**
 * 禁止访问错误类
 */
class ForbiddenError extends AppError {
    constructor(message = '禁止访问') {
        super(message, 403, 'FORBIDDEN');
    }
}

/**
 * 开发环境错误响应
 */
const sendErrorDev = (err, req, res) => {
    const errorData = {
        success: false,
        error: {
            message: err.message,
            stack: err.stack
        }
    };
    if (err.code !== undefined && err.code !== null) {
        errorData.error.code = err.code;
    }
    return res.status(err.statusCode).json(errorData);
};

/**
 * 生产环境错误响应
 */
const sendErrorProd = (err, req, res) => {
    // 操作性错误：发送给客户端
    if (err.isOperational) {
        const errorData = {
            success: false,
            error: {
                message: err.message
            }
        };
        if (err.code !== undefined && err.code !== null) {
            errorData.error.code = err.code;
        }
        if (err.errors) {
            errorData.error.errors = err.errors;
        }
        return res.status(err.statusCode).json(errorData);
    }

    // 编程错误：不泄露详细信息
    console.error('ERROR 💥:', err);
    return res.status(500).json({
        success: false,
        error: {
            message: '服务器内部错误'
        }
    });
};

/**
 * 处理JWT错误
 */
const handleJWTError = () => {
    return new AppError('无效的令牌', 401, 'INVALID_TOKEN');
};

/**
 * 处理JWT过期错误
 */
const handleJWTExpiredError = () => {
    return new AppError('令牌已过期', 401, 'TOKEN_EXPIRED');
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || '服务器内部错误';

    // JWT错误处理
    if (err.name === 'JsonWebTokenError') {
        err = handleJWTError();
    } else if (err.name === 'TokenExpiredError') {
        err = handleJWTExpiredError();
    }

    // 根据环境发送不同响应
    if (process.env.NODE_ENV === 'development') {
        return sendErrorDev(err, req, res);
    } else {
        return sendErrorProd(err, req, res);
    }
};

/**
 * 404处理中间件
 */
const notFound = (req, res, next) => {
    const error = new NotFoundError(`找不到路由`);
    next(error);
};

/**
 * 异步错误包装器
 * 用于包装async函数，自动捕获错误并传递给错误处理中间件
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 错误日志记录中间件
 */
const errorLogger = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, {
        message: err.message,
        statusCode: err.statusCode,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next(err);
};

/**
 * 请求错误监控中间件
 */
const errorMonitor = (err, req, res, next) => {
    // 这里可以集成错误监控服务，如Sentry、Bugsnag等
    // 示例: Sentry.captureException(err);
    next(err);
};

export {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    errorHandler,
    notFound,
    asyncHandler,
    errorLogger,
    errorMonitor
};
