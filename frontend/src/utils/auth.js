// 用户认证和状态管理工具
// 使用真实后端API

import { authApi, apiUtils } from './api.js';

// 假账户数据（用于开发测试，作为fallback）
const MOCK_USERS = [
  {
    id: '1',
    username: 'user1',
    password: '123456',
    name: '张三',
    email: 'user1@example.com',
    phone: '13800138001',
    role: 'user',
    avatar: null
  },
  {
    id: '2',
    username: 'user2',
    password: '123456',
    name: '李四',
    email: 'user2@example.com',
    phone: '13800138002',
    role: 'user',
    avatar: null
  },
  {
    id: '3',
    username: 'seller',
    password: '123456',
    name: '商家账号',
    email: 'seller@example.com',
    phone: '13800138003',
    role: 'seller',
    avatar: null
  }
]

// 从localStorage获取用户信息
export const getCurrentUser = () => {
  return apiUtils.getCurrentUser()
}

// 保存用户信息到localStorage
export const setCurrentUser = (user) => {
  return apiUtils.setCurrentUser(user)
}

// 检查是否已登录
export const isAuthenticated = () => {
  return apiUtils.isAuthenticated()
}

// 登录验证（调用真实API）
export const login = async (username, password) => {
  try {
    const response = await authApi.login(username, password)
    return response
  } catch (error) {
    // 如果API调用失败，回退到假数据（仅用于开发测试）
    console.warn('API调用失败，使用假数据:', error.message)
    const user = MOCK_USERS.find(
      u => u.username === username && u.password === password
    )

    if (user) {
      // 不保存密码
      const { password: _, ...userWithoutPassword } = user
      setCurrentUser(userWithoutPassword)
      return {
        success: true,
        user: userWithoutPassword
      }
    }

    return {
      success: false,
      message: '用户名或密码错误'
    }
  }
}

// 登出
export const logout = async () => {
  const user = getCurrentUser()
  if (user) {
    try {
      await authApi.logout(user.id)
    } catch (error) {
      console.error('登出API调用失败:', error)
    }
  }
  setCurrentUser(null)
}

// 获取购物车数量（假数据，后续接入真实API）
export const getCartCount = () => {
  const cartStr = localStorage.getItem('cart')
  if (cartStr) {
    const cart = JSON.parse(cartStr)
    return cart.reduce((total, item) => total + item.quantity, 0) || 0
  }
  return 0
}

// 获取假账户列表（用于开发测试）
export const getMockUsers = () => {
  return MOCK_USERS.map(({ password, ...user }) => ({
    ...user,
    password: '***' // 隐藏密码
  }))
}

// 导出API工具
export { apiUtils }
