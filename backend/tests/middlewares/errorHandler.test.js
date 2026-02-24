/**
 * errorHandler 中间件测试用例
 */

const mockReq = () => ({
    originalUrl: '/api/test',
    method: 'GET',
    ip: '127.0.0.1',
    get: jest.fn()
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.statusCode = 200;
    return res;
};

const mockNext = jest.fn();

describe('errorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env.NODE_ENV = 'test';
        errorHandler = require('../../src/middlewares/errorHandler');
    });

    describe('AppError', () => {
        test('应该创建自定义错误', () => {
            const error = new errorHandler.AppError('Test error', 400, 'TEST_ERROR');

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.isOperational).toBe(true);
        });

        test('应该自动设置status属性', () => {
            const error4xx = new errorHandler.AppError('Test', 400);
            const error5xx = new errorHandler.AppError('Test', 500);

            expect(error4xx.status).toBe('fail');
            expect(error5xx.status).toBe('error');
        });
    });

    describe('ValidationError', () => {
        test('应该创建验证错误', () => {
            const errors = [
                { field: 'username', message: 'Username is required' },
                { field: 'email', message: 'Invalid email format' }
            ];
            const error = new errorHandler.ValidationError('Validation failed', errors);

            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.errors).toEqual(errors);
        });
    });

    describe('NotFoundError', () => {
        test('应该创建未找到错误', () => {
            const error = new errorHandler.NotFoundError('Product not found');

            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toBe('Product not found');
        });

        test('应该使用默认消息', () => {
            const error = new errorHandler.NotFoundError();

            expect(error.message).toBe('资源未找到');
        });
    });

    describe('UnauthorizedError', () => {
        test('应该创建未授权错误', () => {
            const error = new errorHandler.UnauthorizedError('Please login first');

            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.message).toBe('Please login first');
        });
    });

    describe('ForbiddenError', () => {
        test('应该创建禁止访问错误', () => {
            const error = new errorHandler.ForbiddenError('Access denied');

            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('FORBIDDEN');
            expect(error.message).toBe('Access denied');
        });
    });

    describe('errorHandler', () => {
        test('应该在开发环境返回详细错误信息', () => {
            process.env.NODE_ENV = 'development';
            jest.resetModules();
            errorHandler = require('../../src/middlewares/errorHandler');

            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new errorHandler.AppError('Test error', 400);
            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        message: 'Test error',
                        stack: expect.any(String)
                    })
                })
            );
        });

        test('应该在生产环境返回简洁错误信息', () => {
            process.env.NODE_ENV = 'production';
            jest.resetModules();
            errorHandler = require('../../src/middlewares/errorHandler');

            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new errorHandler.AppError('Test error', 400);
            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        message: 'Test error'
                    })
                })
            );
        });

        test('应该处理操作性错误', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new errorHandler.ValidationError('Invalid input', [
                { field: 'name', message: 'Required' }
            ]);

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        errors: expect.any(Array)
                    })
                })
            );
        });

        test('应该处理非操作性错误', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Unexpected error');
            error.isOperational = false;

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: '服务器内部错误'
                    })
                })
            );
        });

        test('应该处理Mongoose ValidationError', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            error.errors = {
                username: { path: 'username', message: 'Username is required' },
                email: { path: 'email', message: 'Invalid email' }
            };

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: '数据验证失败',
                        errors: expect.arrayContaining([
                            expect.objectContaining({
                                field: 'username'
                            })
                        ])
                    })
                })
            );
        });

        test('应该处理Mongoose CastError', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Cast to ObjectId failed');
            error.name = 'CastError';
            error.path = '_id';
            error.value = 'invalid-id';

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('应该处理Mongoose DuplicateKeyError', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Duplicate key');
            error.code = 11000;
            error.keyPattern = { email: 1 };

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: expect.stringContaining('已存在')
                    })
                })
            );
        });

        test('应该处理JWT错误', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Invalid token');
            error.name = 'JsonWebTokenError';

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: '无效的令牌'
                    })
                })
            );
        });

        test('应该处理JWT过期错误', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: '令牌已过期'
                    })
                })
            );
        });
    });

    describe('notFound', () => {
        test('应该创建404错误并传递', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            errorHandler.notFound(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    message: expect.stringContaining('找不到路由')
                })
            );
        });
    });

    describe('asyncHandler', () => {
        test('应该正常处理成功的异步函数', async () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const asyncFn = async () => {
                return { success: true };
            };

            const wrapped = errorHandler.asyncHandler(asyncFn);
            await wrapped(req, res, next);

            expect(next).not.toHaveBeenCalled();
        });

        test('应该捕获异步函数的错误', async () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const asyncFn = async () => {
                throw new Error('Async error');
            };

            const wrapped = errorHandler.asyncHandler(asyncFn);
            await wrapped(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Async error'
                })
            );
        });
    });

    describe('errorLogger', () => {
        test('应该记录错误并传递给下一个中间件', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Test error');

            errorHandler.errorLogger(error, req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('errorMonitor', () => {
        test('应该监控错误并传递给下一个中间件', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new Error('Test error');

            errorHandler.errorMonitor(error, req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('Error chaining', () => {
        test('应该正确处理错误链', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error1 = new errorHandler.NotFoundError('Resource not found');
            const error2 = new errorHandler.UnauthorizedError('Unauthorized');

            errorHandler.notFound(req, res, next);
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    message: expect.stringContaining('找不到路由')
                })
            );

            errorHandler.errorHandler(error1, req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);

            errorHandler.errorHandler(error2, req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('Error with custom status code', () => {
        test('应该使用自定义状态码', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const error = new errorHandler.AppError('Custom error', 422);
            error.code = 'UNPROCESSABLE_ENTITY';

            errorHandler.errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'UNPROCESSABLE_ENTITY'
                    })
                })
            );
        });
    });
});
