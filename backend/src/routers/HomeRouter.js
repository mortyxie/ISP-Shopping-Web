/**
 * 基础主页 API 路由
 */

import express from 'express';
import homeController from '../controllers/HomeController.js';

const router = express.Router();

// 获取所有商品
router.get('/', homeController.getAllProduct);

// 搜索商品
router.get('/search', homeController.searchProduct);

export default router;
