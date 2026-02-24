module.exports = {
    // 测试环境
    testEnvironment: 'node',

    // 测试文件匹配模式
    testMatch: [
        '**/tests/**/*.test.js'
    ],

    // 覆盖率收集配置
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/routers/**',
        '!src/controllers/**'
    ],

    // 覆盖率输出格式
    coverageReporters: ['text', 'lcov', 'html'],

    // 覆盖率阈值
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // 模块路径映射
    moduleDirectories: ['node_modules', 'src'],

    // 忽略的测试文件
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],

    // 每次测试后清除模拟
    clearMocks: true,

    // 自动清除模拟调用和实例
    resetMocks: true,
    restoreMocks: true,

    // 测试超时时间（毫秒）
    testTimeout: 10000,

    // 详细输出
    verbose: true
};
