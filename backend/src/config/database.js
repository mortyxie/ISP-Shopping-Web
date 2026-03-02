/**
 * 内存数据库配置
 * 用于开发和测试，实际生产环境应使用MySQL/PostgreSQL等数据库
 */

// 生成唯一ID
const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

// 初始化数据库数据
const initialData = {
    users: [
        {
            id: '1',
            username: 'user1',
            password: '123456', // 实际应用中应该加密存储
            name: '张三',
            email: 'user1@example.com',
            phone: '13800138001',
            role: 'user',
            avatar: null,
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            username: 'user2',
            password: '123456',
            name: '李四',
            email: 'user2@example.com',
            phone: '13800138002',
            role: 'user',
            avatar: null,
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            username: 'seller',
            password: '123456',
            name: '商家账号',
            email: 'seller@example.com',
            phone: '13800138003',
            role: 'seller',
            avatar: null,
            createdAt: new Date().toISOString()
        }
    ],
    products: Array.from({ length: 30 }, (_, i) => ({
        id: String(i + 1),
        name: `商品 ${i + 1}`,
        description: `这是商品 ${i + 1} 的详细描述`,
        price: Math.floor(Math.random() * 900) + 100,
        image: `https://via.placeholder.com/300x300?text=Product+${i + 1}`,
        stock: Math.floor(Math.random() * 100),
        category: ['电子产品', '服装', '食品', '家居', '图书'][Math.floor(Math.random() * 5)],
        sellerId: '3',
        status: 'active',
        createdAt: new Date().toISOString()
    })),
    bubbles: [
        {
            id: '1',
            userId: '1',
            username: '张三',
            content: '这个商品质量真不错！',
            createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: '2',
            userId: '2',
            username: '李四',
            content: '物流很快，包装也很好',
            createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: '3',
            userId: '1',
            username: '张三',
            content: '推荐给大家！',
            createdAt: new Date(Date.now() - 10800000).toISOString()
        },
        {
            id: '4',
            userId: '2',
            username: '李四',
            content: '性价比很高，值得购买',
            createdAt: new Date(Date.now() - 14400000).toISOString()
        },
        {
            id: '5',
            userId: '1',
            username: '张三',
            content: '客服态度很好',
            createdAt: new Date(Date.now() - 18000000).toISOString()
        }
    ],
    cart: [],
    orders: [],
    reviews: []
};

// 数据库操作类
class Database {
    constructor() {
        this.data = JSON.parse(JSON.stringify(initialData));
    }

    // 通用查询方法
    findAll(table) {
        return this.data[table] || [];
    }

    findById(table, id) {
        return this.data[table]?.find(item => item.id === id) || null;
    }

    findBy(table, condition) {
        return this.data[table]?.filter(item => {
            return Object.keys(condition).every(key => item[key] === condition[key]);
        }) || [];
    }

    insert(table, item) {
        if (!this.data[table]) {
            this.data[table] = [];
        }
        item.id = item.id || generateId();
        item.createdAt = item.createdAt || new Date().toISOString();
        this.data[table].push(item);
        return item;
    }

    update(table, id, updates) {
        const index = this.data[table]?.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[table][index] = {
                ...this.data[table][index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.data[table][index];
        }
        return null;
    }

    delete(table, id) {
        const index = this.data[table]?.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[table].splice(index, 1);
            return true;
        }
        return false;
    }

    // 重置数据库
    reset() {
        this.data = JSON.parse(JSON.stringify(initialData));
    }
}

// 创建单例实例
const db = new Database();

export default db;
