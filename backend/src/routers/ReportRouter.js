/**
 * 销售报告 API 路由
 */

import express from 'express';
import reportController from '../controllers/ReportController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 测试是否为卖主
router.use(authenticate, authorize('seller'));

// 销售报告
router.get('/report', reportController.getTotalAmount);

// 销售排行榜
router.get('/ranking', reportController.getSalesRanking);

export default router;
