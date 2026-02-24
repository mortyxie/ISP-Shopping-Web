/**
 * ISP购物网站后端主入口文件
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const homeRouter = require('./routers/HomeRouter');
const userRouter = require('./routers/UserRouter');
const bubbleRouter = require('./routers/BubbleRouter');
const cartRouter = require('./routers/CartRouter');
const productDetailRouter = require('./routers/ProductDetailRouter');
const productManageRouter = require('./routers/ProductManageRouter');
const reviewRouter = require('./routers/ReviewRouter');
const orderRouter = require('./routers/OrderRouter');
const reportRouter = require('./routers/ReportRouter');

// 导入中间件
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');
const rateLimiter = require('./middlewares/rateLimiter');

const app = express();

// 配置中间件
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use(logger);

// 速率限制
app.use(rateLimiter);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api', homeRouter);
app.use('/api', userRouter);
app.use('/api', bubbleRouter);
app.use('/api', cartRouter);
app.use('/api', productDetailRouter);
app.use('/api', productManageRouter);
app.use('/api', reviewRouter);
app.use('/api', orderRouter);
app.use('/api', reportRouter);

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(errorHandler);

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api`);
});

module.exports = app;
