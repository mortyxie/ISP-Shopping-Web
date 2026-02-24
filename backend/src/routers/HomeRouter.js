//基础主页 api

import express from 'express';

const router = express.Router();
router.use(express.json());
const homeController=require('../controllers/HomeController');
const productDetalController=require('../controllers/ProductDetailController');


//获取所有商品
router.get('/',homeController.getAllProduct);

//搜索
router.get('/search',homeController.searchPoduct)


module.exports = router