# 中间件测试文档

本文档说明如何运行和编写online_shopping项目的中间件测试。

## 测试文件结构

```
tests/
└── middlewares/
    ├── testLogin.test.js        # testLogin中间件测试
    ├── testManager.test.js       # testManager中间件测试
    ├── authMiddleware.test.js    # authMiddleware中间件测试
    ├── validationMiddleware.test.js  # validationMiddleware中间件测试
    ├── rateLimiter.test.js       # rateLimiter中间件测试
    ├── security.test.js          # security中间件测试
    └── errorHandler.test.js      # errorHandler中间件测试
```

## 安装依赖

```bash
npm install --save-dev jest
```

## 运行测试

### 运行所有测试

```bash
npx jest
```

### 运行特定测试文件

```bash
npx jest tests/middlewares/testLogin.test.js
```

### 运行特定测试套件

```bash
npx jest --testNamePattern="test() - 必需认证中间件"
```

### 生成测试覆盖率报告

```bash
npx jest --coverage
```

### 监视模式（文件变化时自动运行）

```bash
npx jest --watch
```

### 详细输出模式

```bash
npx jest --verbose
```

## 测试覆盖率

以下是各个中间件的测试覆盖率目标：

| 中间件 | 分支 | 函数 | 行数 | 语句 |
|--------|------|------|------|------|
| testLogin | 80% | 90% | 85% | 85% |
| testManager | 75% | 85% | 80% | 80% |
| authMiddleware | 70% | 80% | 75% | 75% |
| validationMiddleware | 75% | 85% | 80% | 80% |
| rateLimiter | 70% | 80% | 75% | 75% |
| security | 75% | 85% | 80% | 80% |
| errorHandler | 80% | 90% | 85% | 85% |

## 编写测试用例

### 基本测试结构

```javascript
describe('中间件名称', () => {
    let middleware;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        middleware = require('../../src/middlewares/yourMiddleware');
    });

    test('应该描述测试目的', () => {
        // 准备
        const req = mockReq();
        const res = mockRes();
        const next = mockNext;

        // 执行
        middleware.yourFunction(req, res, next);

        // 断言
        expect(next).toHaveBeenCalled();
    });
});
```

### Mock对象

```javascript
// Mock Express请求对象
const mockReq = () => ({
    headers: {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    user: undefined
});

// Mock Express响应对象
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    return res;
};

// Mock next函数
const mockNext = jest.fn();
```

### 测试断言示例

```javascript
// 测试状态码
expect(res.status).toHaveBeenCalledWith(401);

// 测试返回的JSON
expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: '错误消息'
});

// 测试next是否被调用
expect(next).toHaveBeenCalled();

// 测试next是否未被调用
expect(next).not.toHaveBeenCalled();

// 测试对象属性
expect(req.user).toEqual({
    userId: '123',
    username: 'testuser'
});

// 测试错误
expect(() => {
    middleware.func(req, res, next);
}).toThrow();
```

## 测试最佳实践

1. **命名规范**
   - 测试文件以 `.test.js` 结尾
   - 使用 `describe()` 组织相关测试
   - 使用 `test()` 或 `it()` 编写具体测试用例
   - 测试名称应描述被测试的行为

2. **AAA模式**
   - Arrange（准备）：设置测试数据和Mock对象
   - Act（执行）：调用被测试的函数
   - Assert（断言）：验证结果

3. **隔离性**
   - 每个测试应该独立运行
   - 使用 `beforeEach()` 重置状态
   - 清除所有的Mock和Spy

4. **覆盖率**
   - 确保测试覆盖所有代码路径
   - 测试正常情况和错误情况
   - 测试边界条件

5. **异步测试**
   ```javascript
   test('应该处理异步操作', async () => {
       const result = await middleware.asyncFunction();
       expect(result).toBeDefined();
   });
   ```

## 测试示例

### 认证中间件测试

```javascript
test('应该在有效token时通过', () => {
    const token = createValidToken('123', 'testuser');
    const req = mockReq();
    req.headers.authorization = `Bearer ${token}`;
    const res = mockRes();
    const next = mockNext;

    middleware.test(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
        userId: '123',
        username: 'testuser'
    });
});
```

### 验证中间件测试

```javascript
test('应该在必填字段缺失时拒绝', () => {
    const schema = {
        username: { type: 'string', required: true }
    };

    const req = mockReq();
    req.body = {};
    const res = mockRes();
    const next = mockNext;

    middleware.validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
            success: false,
            message: '请求数据验证失败'
        })
    );
});
```

### 错误处理测试

```javascript
test('应该处理操作性错误', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext;

    const error = new AppError('Test error', 400);
    middleware.errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
            success: false,
            message: 'Test error'
        })
    );
});
```

## 持续集成

测试可以通过GitHub Actions或其他CI工具自动运行：

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - uses: codecov/codecov-action@v2
```

## 故障排除

### 测试失败

如果测试失败，请检查：

1. 是否正确Mock了所有依赖
2. 是否清理了之前的测试状态
3. 断言是否正确
4. 测试数据是否有效

### 覆盖率低

要提高覆盖率：

1. 添加更多的测试用例
2. 测试错误处理路径
3. 测试边界条件
4. 测试所有函数和分支

## 参考资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [Express中间件测试指南](https://expressjs.com/en/guide/writing-middleware.html)
- [JavaScript测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
