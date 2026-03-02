/**
 * ISP购物网站后端主入口文件
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入路由
import homeRouter from './routers/HomeRouter.js';
import userRouter from './routers/UserRouter.js';
import bubbleRouter from './routers/BubbleRouter.js';
import cartRouter from './routers/CartRouter.js';
import productDetailRouter from './routers/ProductDetailRouter.js';
import productManageRouter from './routers/ProductManageRouter.js';
import reviewRouter from './routers/ReviewRouter.js';
import orderRouter from './routers/OrderRouter.js';
import reportRouter from './routers/ReportRouter.js';

// 导入中间件
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { logger } from './middlewares/logger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// 404处理
app.use(notFound);

// 错误处理中间件
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api`);
});

export default app;
