/**
 * security 中间件测试用例
 */

const mockReq = (options = {}) => ({
    headers: options.headers || {},
    method: options.method || 'GET',
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    path: options.path || '/api/test',
    url: options.url || '/api/test',
    ip: options.ip || '127.0.0.1',
    originalUrl: '/api/test',
    secure: options.secure || false,
    get: jest.fn((header) => options.headers?.[header.toLowerCase()])
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('security middleware', () => {
    let security;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        security = require('../../src/middlewares/security');
    });

    describe('securityHeaders', () => {
        test('应该设置所有安全头部', () => {
            const req = mockReq({ secure: false });
            const res = mockRes();
            const next = mockNext;

            security.headers(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
            expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
            expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining('default-src'));
            expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
            expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            expect(next).toHaveBeenCalled();
        });

        test('应该在HTTPS连接时设置HSTS头部', () => {
            const req = mockReq({ secure: true });
            const res = mockRes();
            const next = mockNext;

            security.headers(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', expect.stringContaining('max-age'));
        });
    });

    describe('cors', () => {
        test('应该在OPTIONS请求时返回正确的CORS头部', () => {
            const req = mockReq({ method: 'OPTIONS' });
            const res = mockRes();
            const next = mockNext;

            security.cors()(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.stringContaining('GET'));
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', expect.stringContaining('Content-Type'));
        });

        test('应该在OPTIONS请求时返回204状态', () => {
            const req = mockReq({ method: 'OPTIONS' });
            const res = mockRes();
            const next = mockNext;

            security.cors()(req, res, next);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.end).toHaveBeenCalled();
        });

        test('应该在常规请求时设置CORS头部', () => {
            const req = mockReq({ method: 'GET' });
            const res = mockRes();
            const next = mockNext;

            security.cors()(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
            expect(next).toHaveBeenCalled();
        });

        test('应该使用自定义CORS配置', () => {
            const req = mockReq({ method: 'GET' });
            const res = mockRes();
            const next = mockNext;

            security.cors({
                origin: 'https://example.com',
                credentials: true,
                exposedHeaders: ['X-Custom-Header']
            })(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://example.com');
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Expose-Headers', 'X-Custom-Header');
        });
    });

    describe('corsWhitelist', () => {
        test('应该在白名单来源时设置CORS头部', () => {
            const req = mockReq({
                method: 'GET',
                headers: { origin: 'https://trusted.com' }
            });
            const res = mockRes();
            const next = mockNext;

            security.corsWhitelist(['https://trusted.com', 'https://another.com'])(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://trusted.com');
            expect(next).toHaveBeenCalled();
        });

        test('应该拒绝非白名单来源', () => {
            const req = mockReq({
                method: 'GET',
                headers: { origin: 'https://untrusted.com' }
            });
            const res = mockRes();
            const next = mockNext;

            security.corsWhitelist(['https://trusted.com'])(req, res, next);

            expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything());
            expect(next).toHaveBeenCalled();
        });
    });

    describe('bodySizeLimit', () => {
        test('应该在请求体过大时拒绝', () => {
            const req = mockReq({
                headers: { 'content-length': '10485761' } // 10MB + 1 byte
            });
            const res = mockRes();
            const next = mockNext;

            security.bodySizeLimit(10 * 1024 * 1024)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(413);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('请求体过大')
                })
            );
        });

        test('应该在请求体大小合法时通过', () => {
            const req = mockReq({
                headers: { 'content-length': '1048576' } // 1MB
            });
            const res = mockRes();
            const next = mockNext;

            security.bodySizeLimit(10 * 1024 * 1024)(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('sqlInjectionProtection', () => {
        test('应该检测SQL注入模式', () => {
            const maliciousPatterns = [
                "admin'--",
                "1' OR '1'='1",
                "1; DROP TABLE users--",
                "1 UNION SELECT * FROM users",
                "1' OR '1'='1'--",
                "' OR 1=1--",
                "admin' #",
                "admin'/*",
                "x'; exec master..xp_cmdshell"
            ];

            maliciousPatterns.forEach(pattern => {
                const req = mockReq({ query: { id: pattern } });
                const res = mockRes();
                const next = mockNext;

                security.sqlInjectionProtection(req, res, next);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false,
                        message: '检测到可疑请求，已被拒绝'
                    })
                );
            });
        });

        test('应该在无SQL注入时通过', () => {
            const req = mockReq({ query: { id: '123', name: 'John' } });
            const res = mockRes();
            const next = mockNext;

            security.sqlInjectionProtection(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该检查请求体中的SQL注入', () => {
            const req = mockReq({ body: { comment: "nice post'; DROP TABLE comments--" } });
            const res = mockRes();
            const next = mockNext;

            security.sqlInjectionProtection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('xssProtection', () => {
        test('应该转义HTML特殊字符', () => {
            const req = mockReq({
                query: { search: '<script>alert("XSS")</script>' },
                body: { name: '"><script>' }
            });
            const res = mockRes();
            const next = mockNext;

            security.xssProtection(req, res, next);

            expect(req.query.search).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
            expect(req.body.name).toBe('&quot;&gt;&lt;script&gt;');
            expect(next).toHaveBeenCalled();
        });

        test('应该递归转义嵌套对象', () => {
            const req = mockReq({
                body: {
                    user: {
                        name: '<script>alert(1)</script>',
                        profile: {
                            bio: '"><img src=x onerror=alert(1)>'
                        }
                    }
                }
            });
            const res = mockRes();
            const next = mockNext;

            security.xssProtection(req, res, next);

            expect(req.body.user.name).toContain('&lt;script&gt;');
            expect(req.body.user.profile.bio).toContain('&lt;img');
            expect(next).toHaveBeenCalled();
        });

        test('应该处理数组', () => {
            const req = mockReq({
                body: {
                    tags: ['<script>', '<img>', 'normal']
                }
            });
            const res = mockRes();
            const next = mockNext;

            security.xssProtection(req, res, next);

            expect(req.body.tags[0]).toBe('&lt;script&gt;');
            expect(req.body.tags[2]).toBe('normal');
        });
    });

    describe('pathTraversalProtection', () => {
        test('应该检测路径遍历攻击', () => {
            const maliciousPaths = [
                '/api/../../../etc/passwd',
                '/api/..\\..\\windows\\system32',
                '/api/%2e%2e/',
                '/api/%252e%252e/',
                '/api/....//....//'
            ];

            maliciousPaths.forEach(path => {
                const req = mockReq({ path: path });
                const res = mockRes();
                const next = mockNext;

                security.pathTraversalProtection(req, res, next);

                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        test('应该在正常路径时通过', () => {
            const req = mockReq({ path: '/api/users/123' });
            const res = mockRes();
            const next = mockNext;

            security.pathTraversalProtection(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('methodValidator', () => {
        test('应该在允许的方法时通过', () => {
            const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

            allowedMethods.forEach(method => {
                const req = mockReq({ method: method });
                const res = mockRes();
                const next = mockNext;

                security.methodValidator(req, res, next);

                expect(next).toHaveBeenCalled();
            });
        });

        test('应该在不允许的方法时拒绝', () => {
            const req = mockReq({ method: 'TRACE' });
            const res = mockRes();
            const next = mockNext;

            security.methodValidator(req, res, next);

            expect(res.status).toHaveBeenCalledWith(405);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('不支持的HTTP方法')
                })
            );
        });
    });

    describe('contentTypeValidator', () => {
        test('应该验证POST请求的Content-Type', () => {
            const req = mockReq({
                method: 'POST',
                headers: {
                    'content-length': '100',
                    'content-type': 'application/json'
                }
            });
            const res = mockRes();
            const next = mockNext;

            security.contentTypeValidator(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该在缺少Content-Type时拒绝', () => {
            const req = mockReq({
                method: 'POST',
                headers: { 'content-length': '100' }
            });
            const res = mockRes();
            const next = mockNext;

            security.contentTypeValidator(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('缺少Content-Type')
                })
            );
        });

        test('应该在无效Content-Type时拒绝', () => {
            const req = mockReq({
                method: 'POST',
                headers: {
                    'content-length': '100',
                    'content-type': 'text/html'
                }
            });
            const res = mockRes();
            const next = mockNext;

            security.contentTypeValidator(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('hostValidator', () => {
        test('应该在允许的主机时通过', () => {
            const req = mockReq({
                headers: { host: 'api.example.com' }
            });
            const res = mockRes();
            const next = mockNext;

            security.hostValidator(['api.example.com', 'admin.example.com'])(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('应该在不允许的主机时拒绝', () => {
            const req = mockReq({
                headers: { host: 'malicious.com' }
            });
            const res = mockRes();
            const next = mockNext;

            security.hostValidator(['api.example.com'])(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: '无效的主机头'
                })
            );
        });
    });
});
