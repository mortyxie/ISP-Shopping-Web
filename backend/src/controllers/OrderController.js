/**
 * 订单控制器
 */

import db from '../config/database.js';

/**
 * 返回该用户的所有订单
 * GET /api/orders
 */
const getAllOrder = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const orders = db.findBy('orders', { userId: req.user.userId });

        // 按时间倒序排列
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('获取订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 订单详情
 * GET /api/orders/:order_id
 */
const getOrderDetail = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const { order_id } = req.params;

        const order = db.findById('orders', order_id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }

        // 检查是否是当前用户的订单
        if (order.userId !== req.user.userId && req.user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: '无权访问该订单'
            });
        }

        // 获取订单商品详情
        const enrichedOrder = {
            ...order,
            items: order.items ? order.items.map(item => {
                const product = db.findById('products', item.productId);
                return {
                    ...item,
                    product: product || null
                };
            }).filter(item => item.product !== null) : []
        };

        res.json({
            success: true,
            data: enrichedOrder
        });
    } catch (error) {
        console.error('获取订单详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 用户结账，产生新订单
 * POST /api/cart/order
 */
const addNewOrder = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        // 获取用户的购物车
        const cartItems = db.findBy('cart', { userId: req.user.userId });

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: '购物车为空'
            });
        }

        // 计算总价
        let totalAmount = 0;
        const orderItems = cartItems.map(item => {
            const product = db.findById('products', item.productId);
            if (product) {
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;
                return {
                    productId: item.productId,
                    productName: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    subtotal: itemTotal
                };
            }
            return null;
        }).filter(item => item !== null);

        // 创建订单
        const newOrder = db.insert('orders', {
            userId: req.user.userId,
            items: orderItems,
            totalAmount,
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: new Date().toISOString()
        });

        // 更新商品库存
        cartItems.forEach(item => {
            const product = db.findById('products', item.productId);
            if (product) {
                db.update('products', item.productId, {
                    stock: Math.max(0, product.stock - item.quantity)
                });
            }
        });

        // 清空购物车
        cartItems.forEach(item => {
            db.delete('cart', item.id);
        });

        res.status(201).json({
            success: true,
            message: '订单创建成功',
            data: newOrder
        });
    } catch (error) {
        console.error('创建订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 返回该用户已经完成的订单
 * GET /api/orders/completed
 */
const getOrderCompleted = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const orders = db.findBy('orders', {
            userId: req.user.userId,
            status: 'completed'
        });

        // 按时间倒序排列
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('获取已完成订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    getAllOrder,
    getOrderDetail,
    addNewOrder,
    getOrderCompleted
};
