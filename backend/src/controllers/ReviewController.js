/**
 * 评论控制器
 */

import db from '../config/database.js';

/**
 * 用买家发布评论
 * POST /api/reviews
 */
const postNewReview = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        const { productId, rating, comment } = req.body;

        if (!productId || !rating) {
            return res.status(400).json({
                success: false,
                message: '商品ID和评分不能为空'
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

        // 检查评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: '评分必须在1-5之间'
            });
        }

        // 创建评论
        const newReview = db.insert('reviews', {
            userId: req.user.userId,
            productId,
            rating,
            comment: comment || '',
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: '评论发布成功',
            data: newReview
        });
    } catch (error) {
        console.error('发布评论错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 获取商品的所有评论
 * GET /api/reviews/product/:product_id
 */
const productReviews = (req, res) => {
    try {
        const { product_id } = req.params;

        const reviews = db.findBy('reviews', { productId: product_id });

        // 按时间倒序排列
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 获取用户信息
        const enrichedReviews = reviews.map(review => {
            const user = db.findById('users', review.userId);
            return {
                ...review,
                user: user ? {
                    id: user.id,
                    username: user.username,
                    name: user.name
                } : null
            };
        });

        res.json({
            success: true,
            data: enrichedReviews
        });
    } catch (error) {
        console.error('获取评论错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 获取商品的平均评分
 * GET /api/reviews/product/:product_id/rating
 */
const getRate = (req, res) => {
    try {
        const { product_id } = req.params;

        const reviews = db.findBy('reviews', { productId: product_id });

        if (reviews.length === 0) {
            return res.json({
                success: true,
                data: {
                    averageRating: 0,
                    reviewCount: 0
                }
            });
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);

        res.json({
            success: true,
            data: {
                averageRating: parseFloat(averageRating),
                reviewCount: reviews.length
            }
        });
    } catch (error) {
        console.error('获取评分错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    postNewReview,
    productReviews,
    getRate
};
