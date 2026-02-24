/**
 * authMiddleware 中间件测试用例
 */

const jwt = require('jsonwebtoken');

const mockReq = () => ({
    headers: {},
    query: {},
    body: {},
    ip: '127.0.0.1'
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

const JWT_SECRET = 'test-secret-key';

beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
});

describe('authMiddleware', () => {
    let authMiddleware;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        authMiddleware = require('../../src/middlewares/authMiddleware');
    });

    describe('generateToken()', () => {
        test('应该生成有效的JWT token', () => {
            const payload = {
                userId: '123',
                username: 'testuser',
                role: 'user'
            };

            const token = authMiddleware.generateToken(payload);

            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);

            const decoded = jwt.verify(token, JWT_SECRET);
            expect(decoded.userId).toBe('123');
            expect(decoded.username).toBe('testuser');
            expect(decoded.role).toBe('user');
        });

        test('应该使用默认角色user', () => {
            const payload = {
                userId: '123',
                username: 'testuser'
            };

            const token = authMiddleware.generateToken(payload);
            const decoded = jwt.verify(token, JWT_SECRET);

            expect(decoded.role).toBe('user');
        });
    });

    describe('generateRefreshToken()', () => {
        test('应该生成有效的刷新token', () => {
            const payload = {
                userId: '123',
                username: 'testuser'
            };

            const refreshToken = authMiddleware.generateRefreshToken(payload);

            expect(typeof refreshToken).toBe('string');
            expect(refreshToken.split('.')).toHaveLength(3);

            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            expect(decoded.userId).toBe('123');
            expect(decoded.type).toBe('refresh');
        });
    });

    describe('verifyToken()', () => {
        test('应该验证有效的token', () => {
            const payload = { userId: '123', username: 'testuser' };
            const token = jwt.sign(payload, JWT_SECRET);

            const decoded = authMiddleware.verifyToken(token);

            expect(decoded.userId).toBe('123');
            expect(decoded.username).toBe('testuser');
        });

        test('应该在无效token时抛出错误', () => {
            expect(() => {
                authMiddleware.verifyToken('invalid.token');
            }).toThrow();
        });
    });

    describe('extractToken()', () => {
        test('应该从Authorization头提取Bearer token', () => {
            const req = mockReq();
            req.headers.authorization = 'Bearer abc123';

            const token = authMiddleware.extractToken(req);

            expect(token).toBe('abc123');
        });

        test('应该从查询参数提取token', () => {
            const req = mockReq();
            req.query.token = 'abc123';

            const token = authMiddleware.extractToken(req);

            expect(token).toBe('abc123');
        });

        test('应该从请求体提取token', () => {
            const req = mockReq();
            req.body.token = 'abc123';

            const token = authMiddleware.extractToken(req);

            expect(token).toBe('abc123');
        });

        test('应该在无token时返回null', () => {
            const req = mockReq();

            const token = authMiddleware.extractToken(req);

            expect(token).toBeNull();
        });
    });

    describe('authenticate() - 基础认证中间件', () => {
        test('应该在有有效token时通过', () => {
            const token = authMiddleware.generateToken({
                userId: '123',
                username: 'testuser',
                role: 'user'
            });

            const req = mockReq();
            req.headers.authorization = `Bearer ${token}`;
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual({
                userId: '123',
                username: 'testuser',
                role: 'user'
            });
        });

        test('应该在无token时拒绝', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '未提供认证令牌'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在token过期时拒绝', () => {
            const expiredToken = jwt.sign(
                { userId: '123', username: 'testuser' },
                JWT_SECRET,
                { expiresIn: '-1s' }
            );

            const req = mockReq();
            req.headers.authorization = `Bearer ${expiredToken}`;
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '令牌已过期',
                code: 'TOKEN_EXPIRED'
            });
        });
    });

    describe('optionalAuth() - 可选认证中间件', () => {
        test('应该在无token时继续', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            authMiddleware.optionalAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        test('应该在有有效token时解析用户', () => {
            const token = authMiddleware.generateToken({
                userId: '123',
                username: 'testuser',
                role: 'user'
            });

            const req = mockReq();
            req.headers.authorization = `Bearer ${token}`;
            const res = mockRes();
            const next = mockNext;

            authMiddleware.optionalAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
        });
    });

    describe('authorize() - 角色授权中间件', () => {
        test('应该在用户未认证时拒绝', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authorize('admin')(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在用户角色不匹配时拒绝', () => {
            const req = mockReq();
            req.user = { userId: '123', role: 'user' };
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authorize('admin')(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        test('应该在用户角色匹配时通过', () => {
            const req = mockReq();
            req.user = { userId: '123', role: 'admin' };
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authorize('admin')(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该支持多个角色', () => {
            const req = mockReq();
            req.user = { userId: '123', role: 'manager' };
            const res = mockRes();
            const next = mockNext;

            authMiddleware.authorize('admin', 'manager')(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('apiKeyAuth() - API密钥认证', () => {
        test('应该在无API密钥时拒绝', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            authMiddleware.apiKeyAuth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '缺少API密钥'
            });
        });

        test('应该在无效API密钥时拒绝', () => {
            process.env.API_KEYS = 'key1,key2';

            const req = mockReq();
            req.headers['x-api-key'] = 'invalid-key';
            const res = mockRes();
            const next = mockNext;

            authMiddleware.apiKeyAuth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '无效的API密钥'
            });
        });

        test('应该在有效API密钥时通过', () => {
            process.env.API_KEYS = 'key1,key2,key3';

            const req = mockReq();
            req.headers['x-api-key'] = 'key2';
            const res = mockRes();
            const next = mockNext;

            authMiddleware.apiKeyAuth(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        afterAll(() => {
            delete process.env.API_KEYS;
        });
    });

    describe('ipWhitelist() - IP白名单', () => {
        test('应该在IP不在白名单时拒绝', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            authMiddleware.ipWhitelist(['192.168.1.1', '10.0.0.1'])(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'IP地址不在白名单中'
            });
        });

        test('应该在IP在白名单时通过', () => {
            const req = mockReq();
            req.ip = '192.168.1.1';
            const res = mockRes();
            const next = mockNext;

            authMiddleware.ipWhitelist(['192.168.1.1', '10.0.0.1'])(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该在通配符时允许所有IP', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            authMiddleware.ipWhitelist(['*'])(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
