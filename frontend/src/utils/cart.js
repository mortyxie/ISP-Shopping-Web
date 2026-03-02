// 购物车管理工具 - 支持真实API和localStorage fallback

import { cartApi, apiUtils } from './api.js';

// 获取购物车数据
export const getCart = async () => {
    try {
        // 尝试从API获取
        if (apiUtils.isAuthenticated()) {
            const data = await cartApi.getCart();
            if (data && data.length > 0) {
                return data;
            }
        }
    } catch (error) {
        console.warn('API调用失败，使用localStorage:', error.message);
    }

    // 使用localStorage作为fallback
    const cartStr = localStorage.getItem('cart');
    if (cartStr) {
        return JSON.parse(cartStr);
    }
    return [];
};

// 保存购物车数据
export const saveCart = async (cart) => {
    try {
        // 尝试同步到API
        if (apiUtils.isAuthenticated()) {
            await cartApi.clearCart();
            for (const item of cart) {
                await cartApi.addToCart(item.productId, item.quantity);
            }
        }
    } catch (error) {
        console.warn('API同步失败，仅保存到localStorage:', error.message);
    }

    // 保存到localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    // 触发自定义事件
    window.dispatchEvent(new Event('cartUpdated'));
};

// 添加商品到购物车
export const addToCart = async (product, quantity = 1) => {
    const cart = await getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
        await saveCart(cart);
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            quantity
        });
        await saveCart(cart);
    }
    return cart;
};

// 更新商品数量
export const updateCartItemQuantity = async (productId, quantity) => {
    const cart = await getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        item.quantity = quantity;
        await saveCart(cart);
    }
    return cart;
};

// 从购物车删除商品
export const removeFromCart = async (productId) => {
    const cart = await getCart();
    const newCart = cart.filter(item => item.id !== productId);
    await saveCart(newCart);
    return newCart;
};

// 清空购物车
export const clearCart = async () => {
    try {
        // 调用API清空
        if (apiUtils.isAuthenticated()) {
            await cartApi.clearCart();
        }
    } catch (error) {
        console.warn('API清空失败:', error.message);
    }

    // 清空localStorage
    localStorage.removeItem('cart');
    // 触发自定义事件
    window.dispatchEvent(new Event('cartUpdated'));
};

// 获取购物车总数量
export const getCartCount = async () => {
    const cart = await getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
};

// 获取购物车总价
export const getCartTotal = async () => {
    const cart = await getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};
