/**
 * 商品详情控制器
 */

import db from '../config/database.js';

/**
 * 获取商品详情
 * GET /api/product/:product_id
 */
const getProductDetail = (req, res) => {
    try {
        const { product_id } = req.params;

        const product = db.findById('products', product_id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('获取商品详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export default {
    getProductDetail
};
