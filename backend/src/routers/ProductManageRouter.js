/**
 * 卖主商品管理 API 路由
 */

import express from 'express';
import productManageController from '../controllers/ProductManageController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 测试是否为卖主
router.use(authenticate, authorize('seller'));

// 浏览商品
router.get('/products', productManageController.allProduct);

// 发布新商品
router.post('/products', productManageController.postNewProduct);

// 下架商品
router.delete('/products/:product_id', productManageController.deleteProduct);

// 更新商品
router.put('/products/:product_id', productManageController.updateProduct);

export default router;
