//评论泡泡api
import express from 'express';

const router = express.Router();
router.use(express.json());
const bubbleController=require('../controllers/BubbleController')
const testLogin=require('../middlewares/testLogin')

//随机展示评论泡泡
router.get('/bubble',bubbleController.dynamicBubble)

//登录后才可以发送
//验证是否登录
//发布评论泡泡
router.post('/bubble/：user_id',testLogin.test,bubbleController.postBubble)


module.exports = router