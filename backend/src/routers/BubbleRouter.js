/**
 * 评论泡泡 API 路由
 */

import express from 'express';
import bubbleController from '../controllers/BubbleController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 随机展示评论泡泡（首页使用）
router.get('/bubble', bubbleController.dynamicBubble);

// 获取所有评论泡泡（论坛页面使用）
router.get('/bubbles', bubbleController.getAllBubbles);

// 发布评论泡泡（需要登录）
router.post('/bubble/:user_id', authenticate, bubbleController.postBubble);

export default router;
