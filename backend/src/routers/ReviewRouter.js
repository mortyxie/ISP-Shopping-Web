/**
 * 用户评论 API 路由
 */

import express from 'express';
import reviewController from '../controllers/ReviewController.js';
import orderController from '../controllers/OrderController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 用户在登录后才可发表评价
router.use(authenticate);

// 展示用户可以评价的商品（order的状态为completed）
router.get('/:order_id/:order_item_id', orderController.getOrderCompleted);

// 用户发布评论
router.post('/review/:product_id', reviewController.postNewReview);

export default router;
