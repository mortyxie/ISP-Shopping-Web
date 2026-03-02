/**
 * 测试用户是否登录的中间件
 * 注意：此中间件已被 authMiddleware.js 中的 authenticate 替代
 * 保留此文件仅用于向后兼容
 */

import { authenticate } from './authMiddleware.js';

// 重新导出 authenticate 作为 test
export { authenticate as test, authenticate as optionalTest };
