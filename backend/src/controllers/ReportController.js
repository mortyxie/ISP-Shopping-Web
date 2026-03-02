/**
 * 销售分析控制器
 */

import db from '../config/database.js';

/**
 * 总销售数目（仅商家）
 * GET /api/reports/total
 */
const getTotalAmount = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        // 检查是否是商家
        if (req.user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: '仅商家可以访问'
            });
        }

        // 获取商家的所有订单
        const orders = db.findBy('orders', {
            sellerId: req.user.userId
        });

        // 计算总销售额
        let totalAmount = 0;
        let totalOrders = 0;
        let completedOrders = 0;

        orders.forEach(order => {
            totalOrders++;
            if (order.status === 'completed') {
                totalAmount += order.totalAmount || 0;
                completedOrders++;
            }
        });

        res.json({
            success: true,
            data: {
                totalAmount,
                totalOrders,
                completedOrders,
                pendingOrders: totalOrders - completedOrders
            }
        });
    } catch (error) {
        console.error('获取销售数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 销售排行榜（仅商家）
 * GET /api/reports/ranking
 */
const getSalesRanking = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        // 检查是否是商家
        if (req.user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: '仅商家可以访问'
            });
        }

        // 获取所有商品
        const allProducts = db.findAll('products');

        // 按销售额排序商品
        const productsWithSales = allProducts.map(product => {
            // 计算该商品的销售总额
            const relatedOrders = db.findAll('orders').filter(order =>
                order.status === 'completed' &&
                order.items.some(item => item.productId === product.id)
            );

            const totalSales = relatedOrders.reduce((sum, order) => {
                const item = order.items.find(i => i.productId === product.id);
                return sum + (item ? item.subtotal : 0);
            }, 0);

            return {
                ...product,
                totalSales,
                salesCount: relatedOrders.length
            };
        });

        // 按销售额降序排列
        productsWithSales.sort((a, b) => b.totalSales - a.totalSales);

        // 取前10名
        const topProducts = productsWithSales.slice(0, 10);

        res.json({
            success: true,
            data: topProducts
        });
    } catch (error) {
        console.error('获取销售排行榜错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    getTotalAmount,
    getSalesRanking
};
