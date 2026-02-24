//用户评论api
import express from 'express';

const router = express.Router();
router.use(express.json());
const reviewController=require('../controllers/ReviewController')
const testLogin=require('../middlewares/testLogin')
const orderController=require('../controllers/OrderController')

//用户在登录后才可发表评价
router.use(testLogin.test)

//展示用户可以评价的商品（order的状态为completed）
router.get('/:order_id/:order_item_id',orderController.getOrderCompleted)

//用户发布评论
router.post('/review/:product_id',reviewController.postNewReview)

module.exports = router