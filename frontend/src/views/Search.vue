<template>
  <div class="search-page">
    <div class="container">
      <!-- 搜索头部 -->
      <div class="search-header">
        <h1 class="page-title">{{ $t('search.title') }}</h1>

        <!-- 搜索框 -->
        <div class="search-bar">
          <input
            ref="searchInput"
            v-model="searchKeyword"
            type="text"
            :placeholder="$t('search.placeholder')"
            @keyup.enter="handleSearch"
            class="search-input"
          />
          <button @click="handleSearch" class="search-button">
            🔍 {{ $t('search.button') }}
          </button>
        </div>

        <!-- 分类筛选 -->
        <div class="category-filter">
          <button
            @click="filterByCategory(null)"
            :class="['category-btn', { active: !selectedCategory }]"
          >
            {{ $t('search.allCategories') }}
          </button>
          <button
            v-for="category in categories"
            :key="category"
            @click="filterByCategory(category)"
            :class="['category-btn', { active: selectedCategory === category }]"
          >
            {{ getCategoryLabel(category) }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ $t('search.searching') }}</p>
      </div>

      <!-- 搜索结果 -->
      <div v-else class="search-results">
        <!-- 搜索提示 -->
        <div v-if="!searchKeyword" class="search-tip">
          <div class="tip-icon">💡</div>
          <p>{{ $t('search.tip') }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="products.length === 0 && searchKeyword" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>{{ $t('search.noResults') }}</h2>
          <p>{{ $t('search.tryDifferentKeyword') }}</p>
        </div>

        <!-- 商品列表 -->
        <div v-else-if="products.length > 0" class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <router-link :to="`/product/${product.id}`" class="product-link">
              <div class="product-image">
                <img v-if="product.image" :src="product.image" :alt="product.name" />
                <div v-else class="no-image">
                  {{ product.name.charAt(0) }}
                </div>
              </div>
              <div class="product-info">
                <div class="product-category">{{ getCategoryLabel(product.category) }}</div>
                <div class="product-name">{{ product.name }}</div>
                <div class="product-artist">{{ product.artist }}</div>
                <div class="product-price">
                  <span class="price-label">{{ $t('search.price') }}:</span>
                  <span class="price-value">¥{{ product.price }}</span>
                </div>
                <div class="product-condition">{{ getConditionLabel(product.condition) }}</div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="products.length > 0 && hasMore" class="pagination">
          <button
            @click="loadMore"
            :disabled="isLoadingMore"
            class="load-more-button"
          >
            {{ isLoadingMore ? $t('search.loading') : $t('search.loadMore') }}
          </button>
        </div>

        <!-- 结果统计 -->
        <div v-if="products.length > 0" class="results-summary">
          <p>
            {{ $t('search.foundResults', { count: products.length }) }}
            {{ selectedCategory ? ` - ${getCategoryLabel(selectedCategory)}` : '' }}
            {{ searchKeyword ? ` - "${searchKeyword}"` : '' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getProducts } from '../services/productService'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const searchKeyword = ref('')
const selectedCategory = ref(null)
const products = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)
const totalResults = ref(0)

const categories = ['rock', 'pop', 'jazz', 'classical', 'electronic', 'hiphop', 'folk', 'metal', 'punk', 'blues', 'country', 'world']

// 获取分类标签
const getCategoryLabel = (category) => {
  const categoryMap = {
    'rock': t('category.rock'),
    'pop': t('category.pop'),
    'jazz': t('category.jazz'),
    'classical': t('category.classical'),
    'electronic': t('category.electronic'),
    'hiphop': t('category.hiphop'),
    'folk': t('category.folk'),
    'metal': t('category.metal'),
    'punk': t('category.punk'),
    'blues': t('category.blues'),
    'country': t('category.country'),
    'world': t('category.world'),
    'null': t('search.allCategories')
  }
  return categoryMap[category] || category
}

// 获取成色标签
const getConditionLabel = (condition) => {
  const conditionMap = {
    'Mint': '99新',
    'Near Mint': '85新',
    'Good': '75新'
  }
  return conditionMap[condition] || condition
}

// 执行搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  isLoading.value = true
  currentPage.value = 1

  try {
    const results = await getProducts({
      search: searchKeyword.value,
      category: selectedCategory.value,
      limit: 20
    })

    products.value = results
    hasMore.value = results.length >= 20

    // 更新URL参数
    router.replace({
      path: '/search',
      query: {
        q: searchKeyword.value,
        category: selectedCategory.value
      }
    })
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isLoading.value = false
  }
}

// 按分类筛选
const filterByCategory = (category) => {
  selectedCategory.value = category
  handleSearch()
}

// 加载更多结果
const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) {
    return
  }

  isLoadingMore.value = true
  currentPage.value++

  try {
    const moreResults = await getProducts({
      search: searchKeyword.value,
      category: selectedCategory.value,
      limit: 20,
      offset: (currentPage.value - 1) * 20
    })

    products.value = [...products.value, ...moreResults]
    hasMore.value = moreResults.length >= 20
  } catch (error) {
    console.error('Load more error:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// 从URL获取搜索参数
onMounted(async () => {
  const query = route.query

  if (query.q) {
    searchKeyword.value = query.q
  }

  if (query.category) {
    selectedCategory.value = query.category
  }

  // 如果有搜索参数，执行搜索
  if (query.q || query.category) {
    await handleSearch()
  }
})
</script>

<style scoped>
.search-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* 搜索头部 */
.search-header {
  margin-bottom: var(--spacing-xxl);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
}

.search-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-input {
  flex: 1;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color var(--transition-base);
}

.search-input:focus {
  border-color: var(--color-primary);
}

.search-button {
  padding: var(--spacing-md) var(--spacing-xxl);
  background: var(--color-primary);
  color: white;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.search-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 分类筛选 */
.category-filter {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-lg);
}

.category-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-light);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.category-btn:hover {
  border-color: var(--color-primary);
  background: white;
}

.category-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxxl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 搜索提示 */
.search-tip {
  text-align: center;
  padding: var(--spacing-xxxl);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border);
}

.tip-icon {
  font-size: var(--font-size-xxxl);
  margin-bottom: var(--spacing-md);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-xxxl);
}

.empty-icon {
  font-size: var(--font-size-xxxl);
  margin-bottom: var(--spacing-md);
}

.empty-state h2 {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  color: var(--color-text-secondary);
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}

.product-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
  border: 2px solid var(--color-border);
}

.product-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.product-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.product-image {
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  font-weight: bold;
}

.product-info {
  padding: var(--spacing-lg);
}

.product-category {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.product-name {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-artist {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.product-price {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.price-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.price-value {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.product-condition {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin: var(--spacing-xxl) 0;
}

.load-more-button {
  padding: var(--spacing-md) var(--spacing-xxl);
  background: var(--color-primary);
  color: white;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.load-more-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.load-more-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 结果统计 */
.results-summary {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (max-width: 767.98px) {
  .products-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .category-filter {
    justify-content: center;
  }

  .category-btn {
    width: 100%;
  }
}
</style>
