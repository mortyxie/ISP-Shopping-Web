/**
 * rateLimiter 中间件测试用例
 */

const mockReq = (ip = '127.0.0.1', user = null) => ({
    ip: ip,
    user: user,
    headers: {},
    originalUrl: '/api/test'
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    res.on = jest.fn();
    return res;
};

const mockNext = jest.fn();

describe('rateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        jest.useFakeTimers();
        rateLimiter = require('../../src/middlewares/rateLimiter');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('rateLimiter() - 通用速率限制器', () => {
        test('应该在首次请求时通过', () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext;

            const limiter = rateLimiter.rateLimiter({
                windowMs: 60000,
                max: 5
            });

            limiter(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
        });

        test('应该在达到限制时拒绝请求', () => {
            const limiter = rateLimiter.rateLimiter({
                windowMs: 60000,
                max: 2
            });

            const res = mockRes();
            const next = mockNext;

            // 第一次请求
            limiter(mockReq('192.168.1.1'), res, next);

            // 第二次请求
            limiter(mockReq('192.168.1.1'), res, next);

            // 第三次请求应该被拒绝
            limiter(mockReq('192.168.1.1'), res, next);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('请求过于频繁')
                })
            );
            expect(next).toHaveBeenCalledTimes(2);
        });

        test('应该对不同IP独立计数', () => {
            const limiter = rateLimiter.rateLimiter({
                windowMs: 60000,
                max: 2
            });

            const res = mockRes();
            const next = mockNext;

            // IP1发送2次请求
            limiter(mockReq('192.168.1.1'), res, next);
            limiter(mockReq('192.168.1.1'), res, next);

            // IP2发送2次请求（应该通过，因为每个IP独立计数）
            limiter(mockReq('192.168.1.2'), res, next);
            limiter(mockReq('192.168.1.2'), res, next);

            expect(next).toHaveBeenCalledTimes(4);
        });

        test('应该在时间窗口过期后重置计数', () => {
            const limiter = rateLimiter.rateLimiter({
                windowMs: 60000,
                max: 1
            });

            const res = mockRes();
            const next = mockNext;

            // 第一次请求
            limiter(mockReq('192.168.1.1'), res, next);

            // 等待时间窗口过期
            jest.advanceTimersByTime(61000);

            // 第二次请求（时间窗口已过期，应该通过）
            limiter(mockReq('192.168.1.1'), res, next);

            expect(next).toHaveBeenCalledTimes(2);
        });

        test('应该使用自定义键生成器', () => {
            const customKeyGenerator = jest.fn(() => 'custom-key-123');
            const res = mockRes();
            const next = mockNext;

            const limiter = rateLimiter.rateLimiter({
                windowMs: 60000,
                max: 5,
                keyGenerator: customKeyGenerator
            });

            limiter(mockReq('192.168.1.1'), res, next);

            expect(customKeyGenerator).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('ipRateLimiter', () => {
        test('应该限制IP请求速率', () => {
            const limiter = rateLimiter.ipRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 发送101次请求（限制是100）
            for (let i = 0; i < 101; i++) {
                limiter(mockReq('192.168.1.1'), res, next);
            }

            expect(res.status).toHaveBeenCalledWith(429);
        });
    });

    describe('strictIpRateLimiter', () => {
        test('应该更严格地限制IP请求速率', () => {
            const limiter = rateLimiter.strictIpRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 发送6次请求（限制是5）
            for (let i = 0; i < 6; i++) {
                limiter(mockReq('192.168.1.1'), res, next);
            }

            expect(res.status).toHaveBeenCalledWith(429);
            expect(next).toHaveBeenCalledTimes(5);
        });
    });

    describe('userRateLimiter', () => {
        test('应该基于用户ID限制请求', () => {
            const limiter = rateLimiter.userRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 用户1发送请求
            const req1 = mockReq('192.168.1.1', { userId: 'user1' });
            for (let i = 0; i < 5; i++) {
                limiter(req1, res, next);
            }

            // 用户2发送请求（应该独立计数）
            const req2 = mockReq('192.168.1.1', { userId: 'user2' });
            for (let i = 0; i < 5; i++) {
                limiter(req2, res, next);
            }

            expect(next).toHaveBeenCalledTimes(10);
        });

        test('应该在无用户时使用IP作为键', () => {
            const limiter = rateLimiter.userRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 无用户信息的请求
            limiter(mockReq('192.168.1.1'), res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('loginRateLimiter', () => {
        test('应该限制登录尝试', () => {
            const limiter = rateLimiter.loginRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 发送6次登录请求（限制是5）
            for (let i = 0; i < 6; i++) {
                limiter(mockReq('192.168.1.1'), res, next);
            }

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('登录尝试')
                })
            );
        });
    });

    describe('registerRateLimiter', () => {
        test('应该限制注册尝试', () => {
            const limiter = rateLimiter.registerRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 发送4次注册请求（限制是3）
            for (let i = 0; i < 4; i++) {
                limiter(mockReq('192.168.1.1'), res, next);
            }

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('注册尝试')
                })
            );
        });
    });

    describe('requestRateLimiter', () => {
        test('应该限制通用请求速率', () => {
            const limiter = rateLimiter.requestRateLimiter;
            const res = mockRes();
            const next = mockNext;

            // 发送61次请求（限制是60每分钟）
            for (let i = 0; i < 61; i++) {
                limiter(mockReq('192.168.1.1'), res, next);
            }

            expect(res.status).toHaveBeenCalledWith(429);
            expect(next).toHaveBeenCalledTimes(60);
        });
    });

    describe('whitelistedRateLimiter', () => {
        test('应该跳过白名单中的IP', () => {
            const limiter = rateLimiter.whitelistedRateLimiter(['192.168.1.100']);
            const res = mockRes();
            const next = mockNext;

            // 白名单IP发送100次请求
            for (let i = 0; i < 100; i++) {
                limiter(mockReq('192.168.1.100'), res, next);
            }

            expect(next).toHaveBeenCalledTimes(100);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('应该限制非白名单IP', () => {
            const limiter = rateLimiter.whitelistedRateLimiter(['192.168.1.100']);
            const res = mockRes();
            const next = mockNext;

            // 非白名单IP发送101次请求
            for (let i = 0; i < 101; i++) {
                limiter(mockReq('192.168.1.1'), res, next);
            }

            expect(res.status).toHaveBeenCalledWith(429);
        });
    });

    describe('getIpInfo', () => {
        test('应该从x-forwarded-for头部获取IP', () => {
            const req = mockReq();
            req.headers['x-forwarded-for'] = '203.0.113.1';

            rateLimiter.getIpInfo(req, mockRes(), mockNext);

            expect(req.ip).toBe('203.0.113.1');
        });

        test('应该从x-real-ip头部获取IP', () => {
            const req = mockReq();
            req.headers['x-real-ip'] = '203.0.113.2';

            rateLimiter.getIpInfo(req, mockRes(), mockNext);

            expect(req.ip).toBe('203.0.113.2');
        });

        test('应该移除IPv6前缀', () => {
            const req = mockReq();
            req.headers['x-forwarded-for'] = '::ffff:192.168.1.1';

            rateLimiter.getIpInfo(req, mockRes(), mockNext);

            expect(req.ip).toBe('192.168.1.1');
        });

        test('应该处理多个IP', () => {
            const req = mockReq();
            req.headers['x-forwarded-for'] = '203.0.113.1, 203.0.113.2';

            rateLimiter.getIpInfo(req, mockRes(), mockNext);

            expect(req.ip).toBe('203.0.113.1');
        });
    });
});
