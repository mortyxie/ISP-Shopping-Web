/**
 * testLogin 中间件测试用例
 */

const jwt = require('jsonwebtoken');

// Mock express req, res, next
const mockReq = () => ({
    headers: {}
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// Test constants
const JWT_SECRET = 'test-secret-key';

// Helper function to create a valid token
const createValidToken = (userId, username, role = 'user') => {
    return jwt.sign(
        { userId, username, role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Helper function to create an expired token
const createExpiredToken = (userId, username) => {
    return jwt.sign(
        { userId, username, role: 'user' },
        JWT_SECRET,
        { expiresIn: '-1s' }
    );
};

describe('testLogin Middleware', () => {
    let testLogin;
    let originalEnv;

    beforeAll(() => {
        originalEnv = process.env.JWT_SECRET;
        process.env.JWT_SECRET = JWT_SECRET;
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('test() - 必需认证中间件', () => {
        test('应该在有有效token时通过', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = `Bearer ${createValidToken('123', 'testuser')}`;
            const res = mockRes();
            const next = mockNext;

            testLogin.test(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual({
                userId: '123',
                username: 'testuser',
                role: 'user'
            });
            expect(res.status).not.toHaveBeenCalled();
        });

        test('应该在缺少authorization头时拒绝', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            testLogin.test(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '未提供认证令牌，请先登录'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在token格式无效时拒绝', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = 'InvalidFormat token123';
            const res = mockRes();
            const next = mockNext;

            testLogin.test(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '无效的认证令牌格式'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在token无效时拒绝', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = 'Bearer invalid.token.here';
            const res = mockRes();
            const next = mockNext;

            testLogin.test(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '无效的认证令牌'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在token过期时拒绝', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = `Bearer ${createExpiredToken('123', 'testuser')}`;
            const res = mockRes();
            const next = mockNext;

            testLogin.test(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '认证令牌已过期，请重新登录'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该正确解析管理员token', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = `Bearer ${createValidToken('123', 'admin', 'manager')}`;
            const res = mockRes();
            const next = mockNext;

            testLogin.test(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user.role).toBe('manager');
        });
    });

    describe('optionalTest() - 可选认证中间件', () => {
        test('应该在没有token时继续', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            testLogin.optionalTest(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        test('应该在有有效token时解析用户信息', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = `Bearer ${createValidToken('123', 'testuser')}`;
            const res = mockRes();
            const next = mockNext;

            testLogin.optionalTest(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual({
                userId: '123',
                username: 'testuser',
                role: 'user'
            });
        });

        test('应该在token无效时继续', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = 'Bearer invalid.token';
            const res = mockRes();
            const next = mockNext;

            testLogin.optionalTest(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        test('应该在token过期时继续', () => {
            const testLogin = require('../../src/middlewares/testLogin');
            const req = mockReq();
            req.headers.authorization = `Bearer ${createExpiredToken('123', 'testuser')}`;
            const res = mockRes();
            const next = mockNext;

            testLogin.optionalTest(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });
    });
});
