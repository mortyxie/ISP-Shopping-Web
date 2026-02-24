/**
 * 主页控制器
 * 主页展示售卖中的商品，分别展示商品例图，名字，价格
 */

import db from '../config/database.js';

/**
 * 获取所有商品
 * GET /api/
 */
const getAllProduct = (req, res) => {
    try {
        const { page = 1, limit = 30, category } = req.query;

        let products = db.findAll('products');

        // 筛选状态为active的商品
        products = products.filter(p => p.status === 'active');

        // 按分类筛选
        if (category) {
            products = products.filter(p => p.category === category);
        }

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = products.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: products.length
            }
        });
    } catch (error) {
        console.error('获取商品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 搜索功能
 * GET /api/search
 */
const searchProduct = (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: '搜索关键词不能为空'
            });
        }

        let products = db.findAll('products');

        // 搜索商品名称和描述
        const searchTerm = q.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );

        // 只返回active状态的商品
        products = products.filter(p => p.status === 'active');

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = products.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedProducts,
            query: q,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: products.length
            }
        });
    } catch (error) {
        console.error('搜索错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    getAllProduct,
    searchProduct
};
