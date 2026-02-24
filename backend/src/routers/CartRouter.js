//购物车api
import express from 'express';

const router = express.Router();
router.use(express.json());
const cartController=require('../controllers/CartController')
const testLogin=require('../middlewares/testLogin')
const productDetalController=require('../controllers/ProductDetailController');
const orderController=require('../controllers/OrderController')

//验证用户是否登入(middleware/中间件)
router.use(testLogin.test)

//获取购物车中的商品
router.get('/:cart_item_id',cartController.getAllinCart)

//更改商品数量
router.put('/:cart_item_id/:product_id',cartController.changeQuanity)

//删除商品
router.delete('/:cart_item_id/:product_id',cartController.deleteProduct)

//查看商品细节
router.get('/:album_id',productDetalController.getProductDetail)

//清空购物车
router.delete('/:cart_item_id',cartController.clearAll)

//结账
router.post('/order',orderController.addNewOrder)

module.exports = router