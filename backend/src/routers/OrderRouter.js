/**
 * 订单 API 路由
 */

import express from 'express';
import orderController from '../controllers/OrderController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 使用认证中间件
router.use(authenticate);

// 获取订单
router.get('/orders', orderController.getAllOrder);

// 订单详情
router.get('/orders/:order_id', orderController.getOrderDetail);

// 获取已完成订单
router.get('/orders/completed', orderController.getOrderCompleted);

export default router;
