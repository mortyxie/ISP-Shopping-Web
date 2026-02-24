//用户登录api

import express from 'express';

const router = express.Router();
router.use(express.json());
const userController=require('../controllers/UserController')


//用户登入
router.post('/login',userController.login)

//用户登出
router.post('/logout/:user_id',userController.logout)

//用户注册
router.post('/register',userController.register)

module.exports = router