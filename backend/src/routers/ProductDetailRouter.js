import express from 'express';

const router = express.Router();
router.use(express.json());
const productDetailController=require('../controllers/ProductDetailController')
const reviewController=require('../controllers/ReviewController')

//获取商品细节
router.get('/:product_id',productDetailController.getProductDetail)

//查看买家反馈
router.get('/:product_id/reviews',reviewController.productReviews)

//查看买家评分
router.get('/:product_id/reviews',reviewController.getrate)


module.exports = router