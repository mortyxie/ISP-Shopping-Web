/**
 * testManager 中间件测试用例
 */

const mockReq = () => ({
    user: undefined,
    params: {}
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('testManager Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('test() - 卖主权限验证中间件', () => {
        test('应该在用户未认证时拒绝', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            testManager.test(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '未认证，请先登录'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在普通用户时拒绝', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: '123',
                username: 'testuser',
                role: 'user'
            };
            const res = mockRes();
            const next = mockNext;

            testManager.test(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '权限不足，仅卖主或管理员可访问此功能'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在卖主时通过', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: '123',
                username: 'manager',
                role: 'manager'
            };
            const res = mockRes();
            const next = mockNext;

            testManager.test(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.isManager).toBe(true);
            expect(req.isAdmin).toBe(false);
        });

        test('应该在管理员时通过', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: '123',
                username: 'admin',
                role: 'admin'
            };
            const res = mockRes();
            const next = mockNext;

            testManager.test(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.isManager).toBe(true);
            expect(req.isAdmin).toBe(true);
        });
    });

    describe('testAdmin() - 超级管理员验证中间件', () => {
        test('应该在用户未认证时拒绝', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            testManager.testAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '未认证，请先登录'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在卖主时拒绝', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: '123',
                username: 'manager',
                role: 'manager'
            };
            const res = mockRes();
            const next = mockNext;

            testManager.testAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '权限不足，仅超级管理员可访问此功能'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在管理员时通过', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: '123',
                username: 'admin',
                role: 'admin'
            };
            const res = mockRes();
            const next = mockNext;

            testManager.testAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('checkOwnership() - 资源所有权验证', () => {
        test('应该在用户未认证时拒绝', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const middleware = testManager.checkOwnership('owner123');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在管理员时通过', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: '456',
                username: 'admin',
                role: 'admin'
            };
            const res = mockRes();
            const next = mockNext;

            const middleware = testManager.checkOwnership('owner123');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该在用户是资源所有者时通过', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: 'owner123',
                username: 'testuser',
                role: 'user'
            };
            const res = mockRes();
            const next = mockNext;

            const middleware = testManager.checkOwnership('owner123');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该在用户通过params.user_id匹配时通过', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: 'user123',
                username: 'testuser',
                role: 'user'
            };
            req.params = { user_id: 'user123' };
            const res = mockRes();
            const next = mockNext;

            const middleware = testManager.checkOwnership('different123');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该在用户不是资源所有者时拒绝', () => {
            const testManager = require('../../src/middlewares/testManager');
            const req = mockReq();
            req.user = {
                userId: 'user456',
                username: 'testuser',
                role: 'user'
            };
            req.params = {};
            const res = mockRes();
            const next = mockNext;

            const middleware = testManager.checkOwnership('owner123');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '无权访问此资源'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
