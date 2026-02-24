//卖主商品管理api
import express from 'express';

const router = express.Router();
router.use(express.json());
const productmanageController=require('../controllers/ProductManageController')
const testManager=require('../middlewares/testManager')

//测试是否为卖主
router.use(testManager.test)

//浏览商品
router.get('/album',productmanageController.allProduct)

//发布新商品
router.post('/newalbum',productmanageController.postNewProduct)

//下架商品
router.delete('/album/:album_id',productmanageController.deleteProduct)

//更新商品
router.post('/album/:album_id',productmanageController.updateProduct)

module.exports = router

