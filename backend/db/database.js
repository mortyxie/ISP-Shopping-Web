/**
 * 内存数据库配置
 * 用于开发和测试，实际生产环境应使用MySQL/PostgreSQL等数据库
 */

// 生成唯一ID
const generateId = () => Date.now() + Math.random().toString(36).substring(2, 11);

// 初始化数据库数据
const initialData = {
    users: [
        {
            id: '1',
            username: 'user1',
            password: '123456',
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
            name: '音乐时光唱片店',
            email: 'seller@example.com',
            phone: '13800138003',
            role: 'seller',
            avatar: null,
            createdAt: new Date().toISOString()
        }
    ],
    products: [
        {
            id: '1',
            name: 'The Beatles - Abbey Road',
            description: '披头士1969年经典专辑，原版黑胶唱片，保存良好，附原版内页和封套。',
            price: 299.00,
            image: 'https://via.placeholder.com/300x300/1dc2626/ffffff?text=Abbey+Road',
            stock: 3,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Pink Floyd - Dark Side of the Moon',
            description: '平克·弗洛伊德1973年迷幻摇滚代表作，黑胶唱片，音质清晰。',
            price: 349.00,
            image: 'https://via.placeholder.com/300x300/2563eb/ffffff?text=Dark+Side',
            stock: 2,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            name: 'Queen - A Night at the Opera',
            description: '皇后乐队1975年现场专辑，被誉为摇滚史上最佳现场录音之一。',
            price: 399.00,
            image: 'https://via.placeholder.com/300x300/d97706/ffffff?text=A+Night+at+the+Opera',
            stock: 5,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '4',
            name: 'Eagles - Hotel California',
            description: '老鹰乐队1976年代表作，加州旅馆经典之作。',
            price: 279.00,
            image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Hotel+California',
            stock: 4,
            category: '民谣',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '5',
            name: 'Fleetwood Mac - Rumours',
            description: '弗利特伍德·麦克乐队1977年经典专辑，销量超过4000万张。',
            price: 329.00,
            image: 'https://via.placeholder.com/300x300/059669/ffffff?text=Rumours',
            stock: 3,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '6',
            name: 'Led Zeppelin - IV',
            description: '齐柏林飞艇乐队1971年经典专辑，包含《Stairway to Heaven》。',
            price: 389.00,
            image: 'https://via.placeholder.com/300x300/dc2626/ffffff?text=Led+Zeppelin+IV',
            stock: 6,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '7',
            name: 'Michael Jackson - Thriller',
            description: '迈克尔·杰克逊1982年专辑，史上最畅销专辑之一。',
            price: 429.00,
            image: 'https://via.placeholder.com/300x300/7c3aed/ffffff?text=Thriller',
            stock: 2,
            category: '流行',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '8',
            name: 'David Bowie - Ziggy Stardust',
            description: '大卫·鲍伊1972年概念专辑，华丽摇滚代表作。',
            price: 319.00,
            image: 'https://via.placeholder.com/300x300/db2777/ffffff?text=Ziggy+Stardust',
            stock: 4,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '9',
            name: 'Miles Davis - Kind of Blue',
            description: '迈尔斯·戴维斯1959年爵士经典，现代爵士里程碑之作。',
            price: 459.00,
            image: 'https://via.placeholder.com/300x300/4f46e5/ffffff?text=Kind+of+Blue',
            stock: 1,
            category: '爵士',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '10',
            name: 'Daft Punk - Random Access Memories',
            description: '蠢朋克2013年专辑，电子音乐杰作，获格莱美奖。',
            price: 369.00,
            image: 'https://via.placeholder.com/300x300/7c3aed/ffffff?text=RAM',
            stock: 3,
            category: '电子',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '11',
            name: 'Bob Marley - Legend',
            description: '鲍勃·马利精选集，雷鬼音乐经典，永远的传奇。',
            price: 289.00,
            image: 'https://via.placeholder.com/300x300/059669/ffffff?text=Legend',
            stock: 5,
            category: '民谣',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '12',
            name: 'Nirvana - Nevermind',
            description: '涅槃乐队1991年专辑，垃圾摇滚代表作，改变了90年代音乐。',
            price: 339.00,
            image: 'https://via.placeholder.com/300x300/6b7280/ffffff?text=Nevermind',
            stock: 2,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '13',
            name: 'Radiohead - OK Computer',
            description: '电台司令1997年专辑，艺术摇滚经典，概念创新。',
            price: 379.00,
            image: 'https://via.placeholder.com/300x300/2563eb/ffffff?text=OK+Computer',
            stock: 3,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '14',
            name: 'AC/DC - Back in Black',
            description: 'AC/DC乐队1980年专辑，硬摇滚经典，邦·斯科特最后作品。',
            price: 299.00,
            image: 'https://via.placeholder.com/300x300/dc2626/ffffff?text=Back+in+Black',
            stock: 4,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '15',
            name: 'The Police - Synchronicity',
            description: '警察乐队1983年专辑，新浪潮代表作，含《Every Breath You Take》。',
            price: 319.00,
            image: 'https://via.placeholder.com/300x300/059669/ffffff?text=Synchronicity',
            stock: 2,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '16',
            name: 'Bruno Mars - 24K Magic',
            description: '布鲁诺·马尔斯2016年专辑，流行音乐现代经典。',
            price: 259.00,
            image: 'https://via.placeholder.com/300x300/dc2626/ffffff?text=24K+Magic',
            stock: 6,
            category: '流行',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '17',
            name: 'Adele - 21',
            description: '阿黛尔2011年专辑，灵魂乐力作，销量突破3000万。',
            price: 279.00,
            image: 'https://via.placeholder.com/300x300/d97706/ffffff?text=21',
            stock: 4,
            category: '流行',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '18',
            name: 'The Rolling Stones - Sticky Fingers',
            description: '滚石乐队1971年专辑，摇滚传奇代表作。',
            price: 349.00,
            image: 'https://via.placeholder.com/300x300/1dc2626/ffffff?text=Sticky+Fingers',
            stock: 3,
            category: '摇滚',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '19',
            name: 'The Weeknd - After Hours',
            description: '威肯2020年专辑，R&B/流行融合，现代都市之声。',
            price: 269.00,
            image: 'https://via.placeholder.com/300x300/7c3aed/ffffff?text=After+Hours',
            stock: 5,
            category: '电子',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: '20',
            name: 'Billie Eilish - When We All Fall Asleep',
            description: '比莉·艾利什2019年专辑，Z世代代表作。',
            price: 289.00,
            image: 'https://via.placeholder.com/300x300/4f46e5/ffffff?text=WWAFAWD',
            stock: 3,
            category: '电子',
            sellerId: '3',
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ],
    bubbles: [
        {
            id: '1',
            userId: '1',
            username: '张三',
            content: '刚收到Abbey Road黑胶，音质太棒了！第一次听原版黑胶，完全不同的体验。',
            createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: '2',
            userId: '2',
            username: '李四',
            content: '物流很快，包装也很好。唱片保护得很到位，没有任何划痕。',
            createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: '3',
            userId: '1',
            username: '张三',
            content: '推荐给大家！这家店的黑胶品相都不错，价格也合理。',
            createdAt: new Date(Date.now() - 10800000).toISOString()
        },
        {
            id: '4',
            userId: '2',
            username: '李四',
            content: '性价比很高，值得购买。Dark Side of the Moon是我最喜欢的专辑之一。',
            createdAt: new Date(Date.now() - 14400000).toISOString()
        },
        {
            id: '5',
            userId: '1',
            username: '张三',
            content: '客服态度很好，有问必答。推荐卖家！',
            createdAt: new Date(Date.now() - 18000000).toISOString()
        },
        {
            id: '6',
            userId: '2',
            username: '李四',
            content: '有没有人知道这张Led Zeppelin IV是哪年版的？想收一张首版。',
            createdAt: new Date(Date.now() - 21600000).toISOString()
        },
        {
            id: '7',
            userId: '1',
            username: '张三',
            content: '第一次买二手黑胶，需要注意什么吗？求大神指点！',
            createdAt: new Date(Date.now() - 25200000).toISOString()
        },
        {
            id: '8',
            userId: '2',
            username: '李四',
            content: 'Queen的现场专辑音质真的好，能听到观众的欢呼声，太有现场感了！',
            createdAt: new Date(Date.now() - 28800000).toISOString()
        },
        {
            id: '9',
            userId: '1',
            username: '张三',
            content: 'Miles Davis的Kind of Blue绝版，能买到真的很开心。爵士乐迷必收！',
            createdAt: new Date(Date.now() - 32400000).toISOString()
        },
        {
            id: '10',
            userId: '2',
            username: '李四',
            content: 'Daft Punk的RAM双黑胶版本封面太美了，收藏价值很高。',
            createdAt: new Date(Date.now() - 36000000).toISOString()
        }
    ],
    cart: [],
    orders: [
        {
            id: 'order_1',
            userId: '1',
            items: [
                {
                    id: '1',
                    name: 'The Beatles - Abbey Road',
                    image: 'https://via.placeholder.com/300x300/1dc2626/ffffff?text=Abbey+Road',
                    price: 299.00,
                    quantity: 1
                }
            ],
            totalAmount: 299.00,
            status: 'completed',
            shippingAddress: '北京市朝阳区三里屯路',
            shippingName: '张三',
            shippingPhone: '13800138001',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'order_2',
            userId: '2',
            items: [
                {
                    id: '4',
                    name: 'Eagles - Hotel California',
                    image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Hotel+California',
                    price: 279.00,
                    quantity: 2
                }
            ],
            totalAmount: 558.00,
            status: 'shipped',
            shippingAddress: '上海市浦东新区陆家嘴',
            shippingName: '李四',
            shippingPhone: '13800138002',
            createdAt: new Date(Date.now() - 43200000).toISOString()
        }
    ],
    reviews: [
        {
            id: '1',
            userId: '1',
            username: '张三',
            productId: '1',
            productName: 'The Beatles - Abbey Road',
            rating: 5,
            content: '音质非常出色，完全符合描述。原版黑胶的质感真的不一样！',
            createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
            id: '2',
            userId: '2',
            username: '李四',
            productId: '2',
            productName: 'Pink Floyd - Dark Side of the Moon',
            rating: 4,
            content: '品相不错，有轻微使用痕迹但不影响播放。价格合理。',
            createdAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
            id: '3',
            userId: '1',
            username: '张三',
            productId: '4',
            productName: 'Eagles - Hotel California',
            rating: 5,
            content: '经典之作！收藏多年，这次买来送朋友。',
            createdAt: new Date(Date.now() - 518400000).toISOString()
        },
        {
            id: '4',
            userId: '2',
            username: '李四',
            productId: '9',
            productName: 'Miles Davis - Kind of Blue',
            rating: 5,
            content: '爵士乐迷必备，音质清晰，版本稀有。',
            createdAt: new Date(Date.now() - 777600000).toISOString()
        },
        {
            id: '5',
            userId: '1',
            username: '张三',
            productId: '10',
            productName: 'Daft Punk - Random Access Memories',
            rating: 4,
            content: '双黑胶版本，封面设计精美。电子音乐的经典之作。',
            createdAt: new Date(Date.now() - 1036800000).toISOString()
        }
    ]
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
