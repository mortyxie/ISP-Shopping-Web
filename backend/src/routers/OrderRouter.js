//订单api
import express from 'express';

const router = express.Router();
router.use(express.json());
const orderController=require('../controllers/OrderController')
const testLogin=require('../middlewares/testLogin')

//使用订单功能之前需要登录
router.use(testLogin.test)

//获取订单
router.get('/order',orderController.getAllOrder)

//订单细节
router.get('/order/:order_id',orderController.getOrderDetail)

module.exports = router