/**
 * 评论泡泡控制器
 */

import db from '../config/database.js';

/**
 * 随机展示评论泡泡
 * GET /api/bubble
 */
const dynamicBubble = (req, res) => {
    try {
        const { limit = 10 } = req.query;

        let bubbles = db.findAll('bubbles');

        // 随机打乱并取指定数量
        const shuffled = bubbles.sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, parseInt(limit));

        // 格式化返回数据，包含用户信息
        const formattedBubbles = result.map(bubble => {
            const user = db.findById('users', bubble.userId);
            return {
                id: bubble.id,
                userId: bubble.userId,
                user: user?.username || '未知用户',
                content: bubble.content,
                time: formatTime(bubble.createdAt),
                createdAt: bubble.createdAt
            };
        });

        res.json({
            success: true,
            data: formattedBubbles
        });
    } catch (error) {
        console.error('获取评论泡泡错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

/**
 * 发布评论泡泡
 * POST /api/bubble/:user_id
 */
const postBubble = (req, res) => {
    try {
        const { user_id } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空'
            });
        }

        // 查找用户
        const user = db.findById('users', user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 创建新评论
        const newBubble = db.insert('bubbles', {
            userId: user_id,
            content: content.trim()
        });

        res.status(201).json({
            success: true,
            message: '发布成功',
            data: {
                id: newBubble.id,
                userId: newBubble.userId,
                user: user.username,
                content: newBubble.content,
                time: '刚刚',
                createdAt: newBubble.createdAt
            }
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
 * 获取所有评论泡泡（用于论坛页面）
 * GET /api/bubbles
 */
const getAllBubbles = (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        let bubbles = db.findAll('bubbles');

        // 按时间倒序排列
        bubbles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedBubbles = bubbles.slice(startIndex, endIndex);

        // 格式化返回数据
        const formattedBubbles = paginatedBubbles.map(bubble => {
            const user = db.findById('users', bubble.userId);
            return {
                id: bubble.id,
                userId: bubble.userId,
                user: user?.username || '未知用户',
                content: bubble.content,
                time: formatTime(bubble.createdAt),
                createdAt: bubble.createdAt
            };
        });

        res.json({
            success: true,
            data: formattedBubbles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: bubbles.length
            }
        });
    } catch (error) {
        console.error('获取所有评论错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

// 辅助函数：格式化时间
function formatTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN');
}

export default {
    dynamicBubble,
    postBubble,
    getAllBubbles
};
