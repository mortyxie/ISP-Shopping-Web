<template>
  <div class="home">
    <!-- 第一板块：占满整个视口 -->
    <section class="hero-section">
      <!-- 秋叶装饰元素 -->
      <div class="phoenix-decoration">
        <div class="phoenix-flower flower-1">🍁</div>
        <div class="phoenix-flower flower-2">🍂</div>
        <div class="phoenix-flower flower-3">🍁</div>
        <div class="phoenix-flower flower-4">🍂</div>
        <div class="phoenix-petal petal-1"></div>
        <div class="phoenix-petal petal-2"></div>
        <div class="phoenix-petal petal-3"></div>
        <div class="phoenix-petal petal-4"></div>
      </div>
      <div class="container hero-container">
        <!-- 左半边：CD机动画 -->
        <div class="cd-player-wrapper">
          <div class="cd-player">
            <div class="cd-disc">
              <div class="cd-center"></div>
            </div>
          </div>
        </div>

        <!-- 右半边：论坛数据展示 -->
        <div class="forum-preview">
          <h2 class="forum-title">{{ $t('home.latestUpdates') }}</h2>
          <div class="forum-list">
            <div
              v-for="(item, index) in forumData"
              :key="index"
              class="forum-item"
            >
              <div class="forum-item-header">
                <span class="forum-user">{{ item.user }}</span>
                <span class="forum-time">{{ item.time }}</span>
              </div>
              <div class="forum-content">{{ item.content }}</div>
            </div>
          </div>
          <div class="forum-more" @click="$router.push('/forum')">
            {{ $t('home.viewMore') }} →
          </div>
        </div>
      </div>
    </section>

    <!-- 第二板块：商品展示 -->
    <section class="products-section">
      <div class="container">
        <h2 class="section-title">{{ $t('home.featuredProducts') }}</h2>
        <div class="products-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
            @click="$router.push(`/product/${product.id}`)"
          >
            <div class="product-image">
              <img :src="product.image" :alt="product.name" />
            </div>
            <div class="product-info">
              <p class="product-name">{{ product.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 设备类型检测（暂时只实现电脑端）
const isMobile = ref(false)

onMounted(() => {
  // 检测设备类型
  const checkDevice = () => {
    // 暂时只做电脑端，移动端检测留空
    isMobile.value = window.innerWidth < 768
  }
  checkDevice()
  window.addEventListener('resize', checkDevice)
})

// 论坛假数据（使用i18n）
const forumData = computed(() => [
  {
    user: t('home.forum.user1'),
    time: t('home.forum.time1'),
    content: t('home.forum.content1')
  },
  {
    user: t('home.forum.user2'),
    time: t('home.forum.time2'),
    content: t('home.forum.content2')
  },
  {
    user: t('home.forum.user3'),
    time: t('home.forum.time3'),
    content: t('home.forum.content3')
  },
  {
    user: t('home.forum.user4'),
    time: t('home.forum.time4'),
    content: t('home.forum.content4')
  },
  {
    user: t('home.forum.user5'),
    time: t('home.forum.time5'),
    content: t('home.forum.content5')
  },
  {
    user: t('home.forum.user6'),
    time: t('home.forum.time6'),
    content: t('home.forum.content6')
  },
  {
    user: t('home.forum.user7'),
    time: t('home.forum.time7'),
    content: t('home.forum.content7')
  },
  {
    user: t('home.forum.user8'),
    time: t('home.forum.time3'),
    content: t('home.forum.content8')
  },
  {
    user: t('home.forum.user9'),
    time: t('home.forum.time4'),
    content: t('home.forum.content9')
  },
  {
    user: t('home.forum.user10'),
    time: t('home.forum.time5'),
    content: t('home.forum.content10')
  }
])

// 生成唱片封面占位图（SVG）
const getRecordPlaceholder = (id) => {
  const colors = [
    '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', // 红色系
    '#ef4444', '#f87171', '#fca5a5', '#fecaca', // 浅红色系
    '#1f2937', '#374151', '#4b5563', '#6b7280', // 灰色系
    '#111827', '#1f2937', '#374151', '#4b5563'  // 深灰色系
  ]
  const color = colors[id % colors.length]
  const color2 = colors[(id + 1) % colors.length]
  
  // 创建SVG唱片封面占位图
  const svg = `
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#grad${id})"/>
      <circle cx="150" cy="150" r="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <circle cx="150" cy="150" r="20" fill="rgba(255,255,255,0.4)"/>
      <text x="150" y="200" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle" font-weight="bold">💿</text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

// 商品假数据（30个，使用i18n）
const products = computed(() => [
  {
    id: 1,
    name: t('home.products.product1'),
    image: getRecordPlaceholder(1)
  },
  {
    id: 2,
    name: t('home.products.product2'),
    image: getRecordPlaceholder(2)
  },
  {
    id: 3,
    name: t('home.products.product3'),
    image: getRecordPlaceholder(3)
  },
  {
    id: 4,
    name: t('home.products.product4'),
    image: getRecordPlaceholder(4)
  },
  {
    id: 5,
    name: t('home.products.product5'),
    image: getRecordPlaceholder(5)
  },
  {
    id: 6,
    name: t('home.products.product6'),
    image: getRecordPlaceholder(6)
  },
  {
    id: 7,
    name: t('home.products.product7'),
    image: getRecordPlaceholder(7)
  },
  {
    id: 8,
    name: t('home.products.product8'),
    image: getRecordPlaceholder(8)
  },
  {
    id: 9,
    name: t('home.products.product9'),
    image: getRecordPlaceholder(9)
  },
  {
    id: 10,
    name: t('home.products.product10'),
    image: getRecordPlaceholder(10)
  },
  {
    id: 11,
    name: t('home.products.product11'),
    image: getRecordPlaceholder(11)
  },
  {
    id: 12,
    name: t('home.products.product12'),
    image: getRecordPlaceholder(12)
  },
  {
    id: 13,
    name: t('home.products.product13'),
    image: getRecordPlaceholder(13)
  },
  {
    id: 14,
    name: t('home.products.product14'),
    image: getRecordPlaceholder(14)
  },
  {
    id: 15,
    name: t('home.products.product15'),
    image: getRecordPlaceholder(15)
  },
  {
    id: 16,
    name: t('home.products.product16'),
    image: getRecordPlaceholder(16)
  },
  {
    id: 17,
    name: t('home.products.product17'),
    image: getRecordPlaceholder(17)
  },
  {
    id: 18,
    name: t('home.products.product18'),
    image: getRecordPlaceholder(18)
  },
  {
    id: 19,
    name: t('home.products.product19'),
    image: getRecordPlaceholder(19)
  },
  {
    id: 20,
    name: t('home.products.product20'),
    image: getRecordPlaceholder(20)
  },
  {
    id: 21,
    name: t('home.products.product21'),
    image: getRecordPlaceholder(21)
  },
  {
    id: 22,
    name: t('home.products.product22'),
    image: getRecordPlaceholder(22)
  },
  {
    id: 23,
    name: t('home.products.product23'),
    image: getRecordPlaceholder(23)
  },
  {
    id: 24,
    name: t('home.products.product24'),
    image: getRecordPlaceholder(24)
  },
  {
    id: 25,
    name: t('home.products.product25'),
    image: getRecordPlaceholder(25)
  },
  {
    id: 26,
    name: t('home.products.product26'),
    image: getRecordPlaceholder(26)
  },
  {
    id: 27,
    name: t('home.products.product27'),
    image: getRecordPlaceholder(27)
  },
  {
    id: 28,
    name: t('home.products.product28'),
    image: getRecordPlaceholder(28)
  },
  {
    id: 29,
    name: t('home.products.product29'),
    image: getRecordPlaceholder(29)
  },
  {
    id: 30,
    name: t('home.products.product30'),
    image: getRecordPlaceholder(30)
  }
])
</script>

<style scoped>
.home {
  width: 100%;
}

/* 第一板块：占满整个视口 */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: #FDC1A7;
  padding: var(--spacing-xxl) 0;
  position: relative;
  overflow: hidden;
}

/* 凤凰花装饰 */
.phoenix-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.phoenix-flower {
  position: absolute;
  font-size: 3rem;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.flower-1 {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.flower-2 {
  top: 20%;
  right: 10%;
  animation-delay: 1s;
}

.flower-3 {
  bottom: 15%;
  left: 8%;
  animation-delay: 2s;
}

.flower-4 {
  bottom: 25%;
  right: 5%;
  animation-delay: 3s;
}

.phoenix-petal {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50% 0 50% 0;
  opacity: 0.2;
  animation: float 8s ease-in-out infinite;
}

.petal-1 {
  top: 30%;
  left: 15%;
  animation-delay: 0.5s;
}

.petal-2 {
  top: 50%;
  right: 20%;
  animation-delay: 1.5s;
}

.petal-3 {
  bottom: 40%;
  left: 25%;
  animation-delay: 2.5s;
}

.petal-4 {
  bottom: 30%;
  right: 15%;
  animation-delay: 3.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

.hero-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xxl);
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* CD机动画 */
.cd-player-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.cd-player {
  width: 400px;
  height: 400px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cd-disc {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: 
    radial-gradient(circle at center, transparent 30px, #374151 30px, #374151 32px, transparent 32px),
    radial-gradient(circle at center, transparent 60px, #374151 60px, #374151 62px, transparent 62px),
    radial-gradient(circle at center, transparent 90px, #374151 90px, #374151 92px, transparent 92px),
    radial-gradient(circle at center, transparent 120px, #374151 120px, #374151 122px, transparent 122px),
    linear-gradient(135deg, #1f2937 0%, #111827 100%);
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: rotate 10s linear infinite;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cd-center {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary);
  z-index: 1;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 论坛数据展示 */
.forum-preview {
  background: var(--color-bg);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  height: 500px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.forum-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-md);
}

.forum-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.forum-list::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.forum-item {
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.forum-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.forum-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.forum-user {
  color: var(--color-primary);
  font-weight: bold;
}

.forum-time {
  color: var(--color-text-secondary);
}

.forum-content {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: 1.6;
}

.forum-more {
  margin-top: var(--spacing-md);
  text-align: center;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: bold;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base);
}

.forum-more:hover {
  background-color: var(--color-accent);
}

/* 第二板块：商品展示 */
.products-section {
  padding: var(--spacing-xxl) 0;
  background: var(--color-bg);
}

.section-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xxl);
  font-weight: bold;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-lg);
  /* 响应式：最小2列，最大5列 */
  /* 暂时只实现电脑端，移动端样式留空 */
}

.product-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-light);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: var(--spacing-md);
}

.product-name {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 - 暂时只做电脑端 */
/* 移动端样式将在后续开发中实现 */
@media (max-width: 1400px) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
  
  .cd-player {
    width: 300px;
    height: 300px;
  }
  
  .cd-disc {
    width: 250px;
    height: 250px;
  }
}

/* 移动端样式暂时留空，将在后续开发中实现 */
@media (max-width: 767.98px) {
  /* 移动端样式待实现 */
}
</style>
