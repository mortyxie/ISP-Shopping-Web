/**
 * API服务工具
 * 用于与后端API通信
 */

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 从localStorage获取token
const getToken = () => localStorage.getItem('token');

// 设置token到localStorage
const setToken = (token) => localStorage.setItem('token', token);

// 清除token
const clearToken = () => localStorage.removeItem('token');

// 获取用户信息
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// 设置用户信息
const setCurrentUser = (user) => {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
};

/**
 * 通用请求函数
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise} 响应数据
 */
const request = async (url, options = {}) => {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
};

/**
 * 用户认证API
 */
export const authApi = {
    // 登录
    login: async (username, password) => {
        const response = await request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success && response.data) {
            setToken(response.data.token);
            setCurrentUser(response.data.user);
        }

        return response;
    },

    // 注册
    register: async (userData) => {
        const response = await request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success && response.data) {
            setToken(response.data.token);
            setCurrentUser(response.data.user);
        }

        return response;
    },

    // 登出
    logout: async (userId) => {
        try {
            await request(`/logout/${userId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('登出错误:', error);
        } finally {
            clearToken();
            setCurrentUser(null);
        }
    },

    // 获取当前用户信息
    getCurrentUser: async () => {
        const response = await request('/user/me', {
            method: 'GET'
        });
        return response.data;
    }
};

/**
 * 商品API
 */
export const productApi = {
    // 获取所有商品
    getAllProducts: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const url = query ? `/?${query}` : '/';
        const response = await request(url);
        return response.data;
    },

    // 搜索商品
    searchProducts: async (keyword, params = {}) => {
        const query = new URLSearchParams({ q: keyword, ...params }).toString();
        const response = await request(`/search?${query}`);
        return response.data;
    },

    // 获取商品详情
    getProductDetail: async (productId) => {
        const response = await request(`/product/${productId}`);
        return response.data;
    }
};

/**
 * 评论泡泡API
 */
export const bubbleApi = {
    // 获取随机评论泡泡（首页使用）
    getDynamicBubbles: async (limit = 10) => {
        const response = await request(`/bubble?limit=${limit}`);
        return response.data;
    },

    // 获取所有评论泡泡（论坛使用）
    getAllBubbles: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const url = query ? `/bubbles?${query}` : '/bubbles';
        const response = await request(url);
        return response.data;
    },

    // 发布评论泡泡
    postBubble: async (userId, content) => {
        const response = await request(`/bubble/${userId}`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        return response.data;
    }
};

/**
 * 购物车API
 */
export const cartApi = {
    // 获取购物车
    getCart: async () => {
        const response = await request('/cart');
        return response.data;
    },

    // 添加到购物车
    addToCart: async (productId, quantity = 1) => {
        const response = await request('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
        return response.data;
    },

    // 更新购物车商品数量
    updateCartItem: async (cartItemId, quantity) => {
        const response = await request(`/cart/${cartItemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
        return response.data;
    },

    // 删除购物车商品
    removeCartItem: async (cartItemId) => {
        const response = await request(`/cart/${cartItemId}`, {
            method: 'DELETE'
        });
        return response.data;
    },

    // 清空购物车
    clearCart: async () => {
        const response = await request('/cart', {
            method: 'DELETE'
        });
        return response.data;
    }
};

/**
 * 订单API
 */
export const orderApi = {
    // 获取订单列表
    getOrders: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const url = query ? `/orders?${query}` : '/orders';
        const response = await request(url);
        return response.data;
    },

    // 获取订单详情
    getOrderDetail: async (orderId) => {
        const response = await request(`/orders/${orderId}`);
        return response.data;
    },

    // 创建订单
    createOrder: async (orderData) => {
        const response = await request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        return response.data;
    }
};

/**
 * 通用工具
 */
export const apiUtils = {
    getToken,
    setToken,
    clearToken,
    getCurrentUser,
    setCurrentUser,
    isAuthenticated: () => !!getToken()
};

// 导出默认对象
export default {
    auth: authApi,
    product: productApi,
    bubble: bubbleApi,
    cart: cartApi,
    order: orderApi,
    utils: apiUtils
};
