/**
 * 卖主管理控制器
 */

import db from '../config/database.js';

/**
 * 显示所有商品（仅商家）
 * GET /api/products/manage
 */
const allProduct = (req, res) => {
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

        // 获取商家的所有商品
        const products = db.findBy('products', { sellerId: req.user.userId });

        res.json({
            success: true,
            data: products
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
 * 发布新商品（仅商家）
 * POST /api/products/manage
 */
const postNewProduct = (req, res) => {
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
                message: '仅商家可以发布商品'
            });
        }

        const { name, description, price, image, category, stock } = req.body;

        // 验证必填字段
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: '商品名称和价格不能为空'
            });
        }

        // 创建新商品
        const newProduct = db.insert('products', {
            name,
            description: description || '',
            price: parseFloat(price),
            image: image || `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`,
            category: category || '其他',
            stock: parseInt(stock) || 0,
            sellerId: req.user.userId,
            status: 'active',
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: '商品发布成功',
            data: newProduct
        });
    } catch (error) {
        console.error('发布商品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 删除商品（仅商家）
 * DELETE /api/products/manage/:product_id
 */
const deleteProduct = (req, res) => {
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
                message: '仅商家可以删除商品'
            });
        }

        const { product_id } = req.params;

        // 查找商品
        const product = db.findById('products', product_id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        // 检查是否是商家的商品
        if (product.sellerId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: '无权删除该商品'
            });
        }

        // 删除商品
        db.delete('products', product_id);

        res.json({
            success: true,
            message: '商品删除成功'
        });
    } catch (error) {
        console.error('删除商品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 更新商品（仅商家）
 * PUT /api/products/manage/:product_id
 */
const updateProduct = (req, res) => {
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
                message: '仅商家可以更新商品'
            });
        }

        const { product_id } = req.params;
        const updates = req.body;

        // 查找商品
        const product = db.findById('products', product_id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        // 检查是否是商家的商品
        if (product.sellerId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: '无权更新该商品'
            });
        }

        // 更新商品
        const updatedProduct = db.update('products', product_id, updates);

        res.json({
            success: true,
            message: '商品更新成功',
            data: updatedProduct
        });
    } catch (error) {
        console.error('更新商品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    allProduct,
    postNewProduct,
    deleteProduct,
    updateProduct
};
