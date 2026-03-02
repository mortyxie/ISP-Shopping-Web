/**
 * 购物车 API 路由
 */

import express from 'express';
import cartController from '../controllers/CartController.js';
import productDetailController from '../controllers/ProductDetailController.js';
import orderController from '../controllers/OrderController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 使用认证中间件
router.use(authenticate);

// 获取购物车中的商品
router.get('/', cartController.getAllinCart);

// 更改商品数量
router.put('/:cart_item_id/:product_id', cartController.changeQuantity);

// 删除商品
router.delete('/:cart_item_id/:product_id', cartController.deleteProduct);

// 查看商品细节
router.get('/product/:product_id', productDetailController.getProductDetail);

// 清空购物车
router.delete('/', cartController.clearAll);

// 结账（创建订单）
router.post('/order', orderController.addNewOrder);

export default router;
