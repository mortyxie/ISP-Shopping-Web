/**
 * 用户登录 API 路由
 */

import express from 'express';
import userController from '../controllers/UserController.js';

const router = express.Router();

// 用户登入
router.post('/login', userController.login);

// 用户登出
router.post('/logout/:user_id', userController.logout);

// 用户注册
router.post('/register', userController.register);

// 获取当前用户信息（需要认证）
router.get('/user/me', userController.getCurrentUser);

export default router;
