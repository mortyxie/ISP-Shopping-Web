//销售报告api
import express from 'express';

const router = express.Router();
router.use(express.json());
const reportController=require('../controllers/ReportController')
const testManager=require('../middlewares/testManager')

//测试是否为卖主
router.use(testManager.test)

//销售报告
router.get('/report',reportController.getTotalAmount)

module.exports = router