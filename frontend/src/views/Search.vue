<template>
  <div class="search-page">
    <div class="container">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search.placeholder')"
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button class="search-button" @click="handleSearch">
            🔍
          </button>
        </div>

        <!-- 分类筛选 -->
        <div class="category-filter">
          <button
            v-for="category in categories"
            :key="category.value"
            class="category-btn"
            :class="{ active: selectedCategory === category.value }"
            @click="selectCategory(category.value)"
          >
            {{ category.label }}
          </button>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="isLoading" class="loading">
        <p>搜索中...</p>
      </div>
      <div v-else-if="products.length === 0" class="empty-results">
        <div class="empty-icon">🔍</div>
        <h2>{{ $t('search.noResults') }}</h2>
        <p>{{ $t('search.noResultsDescription') }}</p>
      </div>
      <div v-else class="search-results">
        <div class="results-header">
          <span class="results-count">找到 {{ products.length }} 个商品</span>
        </div>
        <div class="products-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
            @click="goToProduct(product.id)"
          >
            <div class="product-image-wrapper">
              <img :src="product.image || generatePlaceholder(product.id)" :alt="product.name" class="product-image" />
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="product-category">{{ product.category }}</span>
              </div>
              <div class="product-footer">
                <span class="product-price">¥{{ product.price.toFixed(2) }}</span>
                <button class="add-to-cart" @click.stop="addToCart(product)">
                  🛒
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productApi } from '../utils/api'
import { addToCart as addItemToCart } from '../utils/cart'

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const products = ref([])
const isLoading = ref(false)
const selectedCategory = ref('')

const categories = [
  { value: '', label: '全部分类' },
  { value: 'rock', label: '摇滚' },
  { value: 'pop', label: '流行' },
  { value: 'jazz', label: '爵士' },
  { value: 'classical', label: '古典' },
  { value: 'electronic', label: '电子' },
  { value: 'hiphop', label: '嘻哈' },
  { value: 'folk', label: '民谣' }
]

// 搜索商品
const handleSearch = async () => {
  try {
    isLoading.value = true
    let data

    if (searchQuery.value.trim()) {
      // 有搜索词，使用搜索API
      data = await productApi.searchProducts(searchQuery.value, {
        category: selectedCategory.value || undefined
      })
    } else {
      // 没有搜索词，获取所有商品
      data = await productApi.getAllProducts({
        category: selectedCategory.value || undefined
      })
    }

    products.value = data || []
  } catch (error) {
    console.error('搜索失败:', error)
    products.value = []
  } finally {
    isLoading.value = false
  }
}

// 选择分类
const selectCategory = (category) => {
  selectedCategory.value = category
  handleSearch()
}

// 跳转到商品详情
const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 添加到购物车
const addToCart = async (product) => {
  await addItemToCart({
    id: product.id,
    name: product.name,
    image: product.image || generatePlaceholder(product.id),
    price: product.price
  }, 1)
  window.dispatchEvent(new Event('cartUpdated'))
  alert('已添加到购物车')
}

// 生成占位图
const generatePlaceholder = (id) => {
  const colors = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777']
  const color = colors[id % colors.length]
  const svg = `
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="${color}"/>
      <circle cx="150" cy="150" r="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
      <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <circle cx="150" cy="150" r="20" fill="rgba(255,255,255,0.4)"/>
    </svg>
  `.trim()
  return `data:image/svg+xml;base64,${btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode('0x' + p1)))}`
}

onMounted(() => {
  // 检查URL参数
  const urlQuery = route.query.q
  const urlCategory = route.query.category

  if (urlQuery) {
    searchQuery.value = urlQuery
  }
  if (urlCategory) {
    selectedCategory.value = urlCategory
  }

  // 初始搜索
  handleSearch()
})
</script>

<style scoped>
.search-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.search-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.search-box {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-input {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  outline: none;
  transition: all var(--transition-base);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.search-button {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xl);
  cursor: pointer;
  transition: all var(--transition-base);
}

.search-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.category-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
}

.category-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-accent);
}

.category-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.loading,
.empty-results {
  text-align: center;
  padding: var(--spacing-xxxl) var(--spacing-lg);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
}

.empty-results h2 {
  font-size: var(--font-size-xxl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.empty-results p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.search-results {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.results-header {
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-lg);
}

.results-count {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
}

.product-card {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.product-image-wrapper {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-info {
  padding: var(--spacing-md);
}

.product-name {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
}

.product-meta {
  margin-bottom: var(--spacing-sm);
}

.product-category {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.add-to-cart {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.add-to-cart:hover {
  background: var(--color-primary-dark);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--spacing-md);
  }

  .category-filter {
    gap: var(--spacing-xs);
  }

  .category-btn {
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}
</style>
