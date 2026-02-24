/**
 * validationMiddleware 中间件测试用例
 */

const mockReq = () => ({
    body: {},
    query: {},
    params: {}
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('validationMiddleware', () => {
    let validationMiddleware;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        validationMiddleware = require('../../src/middlewares/validationMiddleware');
    });

    describe('validateBody()', () => {
        test('应该在必填字段缺失时拒绝', () => {
            const schema = {
                username: { type: 'string', required: true },
                password: { type: 'string', required: true }
            };

            const req = mockReq();
            req.body = { username: 'testuser' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: '请求数据验证失败',
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password',
                            message: 'password 为必填项'
                        })
                    ])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在字段类型错误时拒绝', () => {
            const schema = {
                age: { type: 'number', required: true },
                name: { type: 'string', required: true }
            };

            const req = mockReq();
            req.body = { age: '25', name: 'John' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'age',
                            message: 'age 应为 number 类型'
                        })
                    ])
                })
            );
        });

        test('应该在字符串长度验证失败时拒绝', () => {
            const schema = {
                username: { type: 'string', required: true, minLength: 4, maxLength: 10 }
            };

            const req = mockReq();
            req.body = { username: 'abc' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'username',
                            message: expect.stringContaining('长度不能少于')
                        })
                    ])
                })
            );
        });

        test('应该在数字范围验证失败时拒绝', () => {
            const schema = {
                price: { type: 'number', required: true, min: 0, max: 1000 }
            };

            const req = mockReq();
            req.body = { price: 1500 };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'price',
                            message: 'price 不能大于 1000'
                        })
                    ])
                })
            );
        });

        test('应该在正则验证失败时拒绝', () => {
            const schema = {
                email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
            };

            const req = mockReq();
            req.body = { email: 'invalid-email' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email',
                            message: 'email 格式不正确'
                        })
                    ])
                })
            );
        });

        test('应该在自定义验证失败时拒绝', () => {
            const schema = {
                password: {
                    type: 'string',
                    required: true,
                    validate: (value) => {
                        return value.length >= 8 && /[A-Z]/.test(value);
                    }
                }
            };

            const req = mockReq();
            req.body = { password: 'weak' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password',
                            message: 'password 验证失败'
                        })
                    ])
                })
            );
        });

        test('应该在枚举验证失败时拒绝', () => {
            const schema = {
                status: {
                    type: 'string',
                    required: true,
                    enum: ['active', 'inactive', 'pending']
                }
            };

            const req = mockReq();
            req.body = { status: 'invalid' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'status',
                            message: expect.stringContaining('必须是以下值之一')
                        })
                    ])
                })
            );
        });

        test('应该在验证通过时继续', () => {
            const schema = {
                username: { type: 'string', required: true, minLength: 4 },
                age: { type: 'number', required: true, min: 0 }
            };

            const req = mockReq();
            req.body = { username: 'testuser', age: 25 };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('应该跳过非必填且缺失的字段', () => {
            const schema = {
                username: { type: 'string', required: true },
                nickname: { type: 'string', required: false }
            };

            const req = mockReq();
            req.body = { username: 'testuser' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateBody(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('validateQuery()', () => {
        test('应该转换查询参数类型', () => {
            const schema = {
                page: { type: 'number', required: true },
                limit: { type: 'number', required: true }
            };

            const req = mockReq();
            req.query = { page: '1', limit: '10' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateQuery(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(typeof req.query.page).toBe('number');
            expect(typeof req.query.limit).toBe('number');
        });

        test('应该转换布尔类型', () => {
            const schema = {
                active: { type: 'boolean' }
            };

            const req = mockReq();
            req.query = { active: 'true' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateQuery(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.query.active).toBe(true);
        });
    });

    describe('validateParams()', () => {
        test('应该验证路径参数', () => {
            const schema = {
                id: { type: 'number', required: true }
            };

            const req = mockReq();
            req.params = { id: '123' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateParams(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(typeof req.params.id).toBe('number');
        });
    });

    describe('sanitize()', () => {
        test('应该去除字符串首尾空格', () => {
            const req = mockReq();
            req.body = { username: '  testuser  ', email: '  test@example.com  ' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.sanitize(req, res, next);

            expect(req.body.username).toBe('testuser');
            expect(req.body.email).toBe('test@example.com');
        });

        test('应该移除undefined和null字段', () => {
            const req = mockReq();
            req.body = {
                username: 'test',
                email: undefined,
                password: null,
                age: 25
            };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.sanitize(req, res, next);

            expect(req.body.username).toBe('test');
            expect(req.body.email).toBeUndefined();
            expect(req.body.password).toBeUndefined();
            expect(req.body.age).toBe(25);
        });

        test('应该递归处理嵌套对象', () => {
            const req = mockReq();
            req.body = {
                username: '  test  ',
                address: {
                    city: '  Beijing  ',
                    street: ' Main St  '
                }
            };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.sanitize(req, res, next);

            expect(req.body.username).toBe('test');
            expect(req.body.address.city).toBe('Beijing');
            expect(req.body.address.street).toBe('Main St');
        });
    });

    describe('validateId()', () => {
        test('应该在缺少ID时拒绝', () => {
            const req = mockReq();
            req.params = {};
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateId('productId')(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'productId 参数缺失'
            });
        });

        test('应该在无效MongoDB ObjectId时拒绝', () => {
            const req = mockReq();
            req.params = { productId: 'invalid-id' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateId('productId')(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('无效的')
                })
            );
        });

        test('应该在有效ObjectId时通过', () => {
            const req = mockReq();
            req.params = { productId: '507f1f77bcf86cd799439011' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validateId('productId')(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('validatePagination()', () => {
        test('应该设置分页参数', () => {
            const req = mockReq();
            req.query = { page: '2', limit: '20' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validatePagination(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.pagination).toEqual({
                page: 2,
                limit: 20,
                skip: 20,
                sortBy: 'createdAt',
                sortOrder: -1
            });
        });

        test('应该使用默认值', () => {
            const req = mockReq();
            req.query = {};
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validatePagination(req, res, next);

            expect(req.pagination.page).toBe(1);
            expect(req.pagination.limit).toBe(10);
            expect(req.pagination.skip).toBe(0);
        });

        test('应该在页码小于1时拒绝', () => {
            const req = mockReq();
            req.query = { page: '0' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validatePagination(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '页码必须大于0'
            });
        });

        test('应该在limit超出范围时拒绝', () => {
            const req = mockReq();
            req.query = { limit: '200' };
            const res = mockRes();
            const next = mockNext;

            validationMiddleware.validatePagination(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '每页数量必须在1-100之间'
            });
        });
    });

    describe('validationRules', () => {
        test('邮箱正则应该验证正确', () => {
            const { validationRules } = validationMiddleware;

            expect(validationRules.email.test('test@example.com')).toBe(true);
            expect(validationRules.email.test('invalid')).toBe(false);
        });

        test('用户名正则应该验证正确', () => {
            const { validationRules } = validationMiddleware;

            expect(validationRules.username.test('user123')).toBe(true);
            expect(validationRules.username.test('us')).toBe(false);
        });

        test('密码正则应该验证正确', () => {
            const { validationRules } = validationMiddleware;

            expect(validationRules.password.test('Password1')).toBe(true);
            expect(validationRules.password.test('weak')).toBe(false);
        });

        test('手机号正则应该验证正确', () => {
            const { validationRules } = validationMiddleware;

            expect(validationRules.phone.test('13812345678')).toBe(true);
            expect(validationRules.phone.test('12345678901')).toBe(false);
        });

        test('价格正则应该验证正确', () => {
            const { validationRules } = validationMiddleware;

            expect(validationRules.price.test('10')).toBe(true);
            expect(validationRules.price.test('10.99')).toBe(true);
            expect(validationRules.price.test('10.999')).toBe(false);
        });
    });
});
