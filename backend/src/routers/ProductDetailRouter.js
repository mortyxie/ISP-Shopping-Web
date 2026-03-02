/**
 * 商品详情 API 路由
 */

import express from 'express';
import productDetailController from '../controllers/ProductDetailController.js';
import reviewController from '../controllers/ReviewController.js';

const router = express.Router();

// 获取商品细节
router.get('/:product_id', productDetailController.getProductDetail);

// 查看买家反馈
router.get('/:product_id/reviews', reviewController.productReviews);

// 查看买家评分
router.get('/:product_id/rating', reviewController.getRate);

export default router;
