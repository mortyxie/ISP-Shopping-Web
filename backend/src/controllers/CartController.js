/**
 * 购物车控制器
 */

import db from '../config/database.js';

/**
 * 获取购物车中所有商品
 * GET /api/cart
 */
const getAllinCart = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        // 从数据库获取用户的购物车
        const cartItems = db.findBy('cart', { userId: req.user.userId });

        // 获取商品详细信息
        const enrichedItems = cartItems.map(item => {
            const product = db.findById('products', item.productId);
            return {
                ...item,
                product: product || null
            };
        }).filter(item => item.product !== null);

        res.json({
            success: true,
            data: enrichedItems
        });
    } catch (error) {
        console.error('获取购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 添加商品到购物车
 * POST /api/cart
 */
const addToCart = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: '商品ID不能为空'
            });
        }

        // 检查商品是否存在
        const product = db.findById('products', productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        // 检查库存
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: '库存不足'
            });
        }

        // 检查购物车中是否已有该商品
        const existingItem = db.findBy('cart', { userId: req.user.userId, productId })[0];

        if (existingItem) {
            // 更新数量
            db.update('cart', existingItem.id, { quantity: existingItem.quantity + quantity });
        } else {
            // 添加新商品
            db.insert('cart', {
                userId: req.user.userId,
                productId,
                quantity,
                createdAt: new Date().toISOString()
            });
        }

        // 获取更新后的购物车
        const updatedCart = db.findBy('cart', { userId: req.user.userId }).map(item => {
            const product = db.findById('products', item.productId);
            return {
                ...item,
                product: product || null
            };
        }).filter(item => item.product !== null);

        res.json({
            success: true,
            message: '添加成功',
            data: updatedCart
        });
    } catch (error) {
        console.error('添加到购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 更改商品数量
 * PUT /api/cart/:cart_item_id/:product_id
 */
const changeQuantity = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const { cart_item_id, product_id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: '数量必须大于0'
            });
        }

        // 查找购物车项
        const cartItem = db.findById('cart', cart_item_id);
        if (!cartItem || cartItem.userId !== req.user.userId) {
            return res.status(404).json({
                success: false,
                message: '购物车项不存在'
            });
        }

        // 检查商品库存
        const product = db.findById('products', product_id);
        if (product && product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: '库存不足'
            });
        }

        // 更新数量
        db.update('cart', cart_item_id, { quantity });

        res.json({
            success: true,
            message: '更新成功',
            data: { id: cart_item_id, quantity }
        });
    } catch (error) {
        console.error('更新数量错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 删除商品
 * DELETE /api/cart/:cart_item_id/:product_id
 */
const deleteProduct = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const { cart_item_id } = req.params;

        // 查找购物车项
        const cartItem = db.findById('cart', cart_item_id);
        if (!cartItem || cartItem.userId !== req.user.userId) {
            return res.status(404).json({
                success: false,
                message: '购物车项不存在'
            });
        }

        // 删除商品
        db.delete('cart', cart_item_id);

        res.json({
            success: true,
            message: '删除成功'
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
 * 清空购物车
 * DELETE /api/cart
 */
const clearAll = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        // 删除用户的所有购物车项
        const userCartItems = db.findBy('cart', { userId: req.user.userId });
        userCartItems.forEach(item => {
            db.delete('cart', item.id);
        });

        res.json({
            success: true,
            message: '清空成功'
        });
    } catch (error) {
        console.error('清空购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    getAllinCart,
    addToCart,
    changeQuantity,
    deleteProduct,
    clearAll
};
