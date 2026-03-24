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
        <!-- 搜索提示 - only show when no search and no category selected -->
        <div v-if="!searched && !isLoading && !showAllAlbums" class="search-tip">
          <div class="tip-icon">💡</div>
          <p>{{ $t('search.tip') }}</p>
        </div>

        <!-- Show all albums when "All Categories" is selected without search -->
        <div v-else-if="showAllAlbums && allAlbums.length > 0" class="results-container">
          <div class="albums-grid">
            <div v-for="album in paginatedAlbums" :key="album.album_id" class="album-card">
              <router-link :to="`/album/${album.album_id}`" class="album-link">
                <div class="album-image">
                  <img v-if="album.cover_image_url" :src="album.cover_image_url" :alt="album.title" />
                  <div v-else class="no-image">
                    {{ album.title?.charAt(0) || '💿' }}
                  </div>
                </div>
                <div class="album-info">
                  <div class="album-category">{{ album.genre || t('category.other') }}</div>
                  <div class="album-title">{{ album.title }}</div>
                  <div class="album-artist">{{ album.artist }}</div>
                  <div class="album-year" v-if="album.release_year">{{ album.release_year }}</div>
                  <div class="album-count">{{ album.product_count || 0 }} {{ $t('search.products') }}</div>
                </div>
              </router-link>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="pagination-controls">
            <button 
              class="page-btn prev-btn" 
              @click="previousPage"
              :disabled="currentPage === 1"
            >
              ← {{ $t('search.previous') }}
            </button>
            
            <div class="page-info">
              {{ $t('search.page') }} {{ currentPage }} / {{ totalPages }}
            </div>
            
            <button 
              class="page-btn next-btn" 
              @click="nextPage"
              :disabled="currentPage === totalPages"
            >
              {{ $t('search.next') }} →
            </button>
          </div>
        </div>

        <!-- Empty state for no results -->
        <div v-else-if="allAlbums.length === 0 && searched" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>{{ $t('search.noResults') }}</h2>
          <p>{{ $t('search.tryDifferentKeyword') }}</p>
        </div>

        <!-- Search results with filters -->
        <div v-else-if="allAlbums.length > 0" class="results-container">
          <div class="albums-grid">
            <div v-for="album in paginatedAlbums" :key="album.album_id" class="album-card">
              <router-link :to="`/album/${album.album_id}`" class="album-link">
                <div class="album-image">
                  <img v-if="album.cover_image_url" :src="album.cover_image_url" :alt="album.title" />
                  <div v-else class="no-image">
                    {{ album.title?.charAt(0) || '💿' }}
                  </div>
                </div>
                <div class="album-info">
                  <div class="album-category">{{ album.genre || t('category.other') }}</div>
                  <div class="album-title">{{ album.title }}</div>
                  <div class="album-artist">{{ album.artist }}</div>
                  <div class="album-year" v-if="album.release_year">{{ album.release_year }}</div>
                  <div class="album-count">{{ album.product_count || 0 }} {{ $t('search.products') }}</div>
                </div>
              </router-link>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="pagination-controls">
            <button 
              class="page-btn prev-btn" 
              @click="previousPage"
              :disabled="currentPage === 1"
            >
              ← {{ $t('search.previous') }}
            </button>
            
            <div class="page-info">
              {{ $t('search.page') }} {{ currentPage }} / {{ totalPages }}
            </div>
            
            <button 
              class="page-btn next-btn" 
              @click="nextPage"
              :disabled="currentPage === totalPages"
            >
              {{ $t('search.next') }} →
            </button>
          </div>
        </div>

        <!-- 结果统计 -->
        <div v-if="allAlbums.length > 0" class="results-summary">
          <p>
            {{ showAllAlbums ? $t('search.allAlbums', { count: allAlbums.length }) : $t('search.foundAlbums', { count: allAlbums.length }) }}
            {{ selectedCategory ? ` - ${getCategoryLabel(selectedCategory)}` : '' }}
            {{ searchKeyword ? ` - "${searchKeyword}"` : '' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const searchKeyword = ref('')
const selectedCategory = ref(null)
const allAlbums = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const searched = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 8

// Computed: Paginated albums
const paginatedAlbums = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return allAlbums.value.slice(start, end)
})

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(allAlbums.value.length / itemsPerPage)
})

// Computed property to check if we're showing all albums
const showAllAlbums = computed(() => {
  return !selectedCategory.value && !searchKeyword.value.trim()
})

// Pagination methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    // Scroll to top of results
    document.querySelector('.search-results')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    document.querySelector('.search-results')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const categories = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'Folk', 'Metal', 'Punk', 'Blues', 'Country', 'World']

// 获取分类标签
const getCategoryLabel = (category) => {
  const categoryMap = {
    'Rock': t('category.rock'),
    'Pop': t('category.pop'),
    'Jazz': t('category.jazz'),
    'Classical': t('category.classical'),
    'Electronic': t('category.electronic'),
    'Hip Hop': t('category.hiphop'),
    'Folk': t('category.folk'),
    'Metal': t('category.metal'),
    'Punk': t('category.punk'),
    'Blues': t('category.blues'),
    'Country': t('category.country'),
    'World': t('category.world')
  }
  return categoryMap[category] || category
}

// 获取所有专辑
const getAllAlbums = async (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.offset) queryParams.append('offset', params.offset)
  
  const response = await fetch(`/api/albums?${queryParams.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch albums')
  return await response.json()
}

// 搜索专辑
const searchAlbums = async (params) => {
  const queryParams = new URLSearchParams()
  
  if (params.search) queryParams.append('search', params.search)
  if (params.category) queryParams.append('genre', params.category)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.offset) queryParams.append('offset', params.offset)
  
  const response = await fetch(`/api/albums/search?${queryParams.toString()}`)
  if (!response.ok) throw new Error('Search failed')
  return await response.json()
}

// 执行搜索或加载所有专辑
const handleSearch = async () => {
  currentPage.value = 1 // Reset to first page on new search
  
  // If no category and no search keyword, show all albums
  if (!selectedCategory.value && !searchKeyword.value.trim()) {
    await loadAllAlbums()
    searched.value = true
    return
  }

  isLoading.value = true
  searched.value = true

  try {
    const params = {
      limit: 100 // Fetch more to enable pagination on client side
    }
    
    if (searchKeyword.value.trim()) {
      params.search = searchKeyword.value.trim()
    }
    
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }

    const results = await searchAlbums(params)
    allAlbums.value = results

    // 更新URL参数
    const query = {}
    if (searchKeyword.value) query.q = searchKeyword.value
    if (selectedCategory.value) query.category = selectedCategory.value
    
    router.replace({
      path: '/search',
      query
    })
  } catch (error) {
    console.error('Search error:', error)
    allAlbums.value = []
  } finally {
    isLoading.value = false
  }
}

// 加载所有专辑
const loadAllAlbums = async () => {
  isLoading.value = true
  currentPage.value = 1
  
  try {
    const results = await getAllAlbums({ limit: 100 })
    allAlbums.value = results
    
    // Clear URL params
    router.replace({ path: '/search', query: {} })
  } catch (error) {
    console.error('Failed to load albums:', error)
    allAlbums.value = []
  } finally {
    isLoading.value = false
  }
}

// 按分类筛选
const filterByCategory = (category) => {
  selectedCategory.value = category
  handleSearch()
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

  // 如果有搜索参数，执行搜索；否则显示所有专辑
  if (query.q || query.category) {
    await handleSearch()
  } else {
    await loadAllAlbums()
  }
})
</script>

<style scoped>
/* Keep all your existing styles */
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
  background: white;
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
  color: var(--color-text-primary);
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
  margin-bottom: var(--spacing-md);
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

.search-tip p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
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

/* 专辑网格 */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}

.album-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
  border: 2px solid var(--color-border);
}

.album-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.album-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.album-image {
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  font-weight: bold;
}

.album-info {
  padding: var(--spacing-lg);
}

.album-category {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  text-transform: capitalize;
}

.album-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-artist {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.album-year {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.album-count {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 500;
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xxl);
  padding: var(--spacing-lg);
}

.page-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: bold;
  transition: all var(--transition-base);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.results-container {
  width: 100%;
}


/* 响应式设计 */
@media (max-width: 992px) {
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 767.98px) {
  .albums-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-button {
    width: 100%;
  }

  .category-filter {
    justify-content: center;
  }

  .category-btn {
    width: 100%;
  }
}
</style>