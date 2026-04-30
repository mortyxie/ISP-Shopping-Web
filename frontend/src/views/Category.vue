<template>
  <div class="category-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ $t('category.title') }}</h1>
        <p class="page-subtitle care-hide">{{ $t('category.subtitle') }}</p>
      </div>

      <div class="care-only care-banner">
        <div class="title">🧭{{ $t('careMode.categoryTitle') }}<</div>
        <div class="desc">{{ $t('careMode.categoryDescription') }}</div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadCategories" class="btn-primary">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- Categories Grid -->
      <div v-else class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
          @click="goToCategory(category)"
        >
          <div class="category-icon">
            <span class="icon-emoji">{{ category.icon }}</span>
          </div>
          <h3 class="category-name">{{ category.name }}</h3>
          <p class="category-description care-hide">{{ category.description }}</p>
          <div class="category-footer">
            <span class="category-count">{{ category.count }} {{ $t('category.albums') }}</span>
            <span class="category-arrow">→</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const categories = ref([])
const isLoading = ref(true)
const error = ref(null)

// Load categories with real album counts from database
const loadCategories = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Fetch all albums to count by genre
    const response = await fetch('/api/albums')
    const albums = await response.json()
    
    // Count albums by genre
    const genreCounts = {}
    albums.forEach(album => {
      const genre = album.genre
      if (genre) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
      }
    })
    
    console.log('Genre counts:', genreCounts)
    
    // Map to categories with real counts
    categories.value = [
      {
        id: 1,
        name: t('category.rock'),
        genre: 'Rock',
        icon: '🎸',
        description: t('category.rockDesc'),
        count: genreCounts['Rock'] || 0
      },
      {
        id: 2,
        name: t('category.pop'),
        genre: 'Pop',
        icon: '🎤',
        description: t('category.popDesc'),
        count: genreCounts['Pop'] || 0
      },
      {
        id: 3,
        name: t('category.jazz'),
        genre: 'Jazz',
        icon: '🎷',
        description: t('category.jazzDesc'),
        count: genreCounts['Jazz'] || 0
      },
      {
        id: 4,
        name: t('category.classical'),
        genre: 'Classical',
        icon: '🎻',
        description: t('category.classicalDesc'),
        count: genreCounts['Classical'] || 0
      },
      {
        id: 5,
        name: t('category.electronic'),
        genre: 'Electronic',
        icon: '🎹',
        description: t('category.electronicDesc'),
        count: genreCounts['Electronic'] || 0
      },
      {
        id: 6,
        name: t('category.hiphop'),
        genre: 'Hip Hop',
        icon: '🎧',
        description: t('category.hiphopDesc'),
        count: genreCounts['Hip Hop'] || 0
      },
      {
        id: 7,
        name: t('category.folk'),
        genre: 'Folk',
        icon: '🪕',
        description: t('category.folkDesc'),
        count: genreCounts['Folk'] || 0
      },
      {
        id: 8,
        name: t('category.metal'),
        genre: 'Metal',
        icon: '🤘',
        description: t('category.metalDesc'),
        count: genreCounts['Metal'] || 0
      },
      {
        id: 9,
        name: t('category.punk'),
        genre: 'Punk',
        icon: '🎸',
        description: t('category.punkDesc'),
        count: genreCounts['Punk'] || 0
      },
      {
        id: 10,
        name: t('category.blues'),
        genre: 'Blues',
        icon: '🎵',
        description: t('category.bluesDesc'),
        count: genreCounts['Blues'] || 0
      },
      {
        id: 11,
        name: t('category.country'),
        genre: 'Country',
        icon: '🎪',
        description: t('category.countryDesc'),
        count: genreCounts['Country'] || 0
      },
      {
        id: 12,
        name: t('category.world'),
        genre: 'World',
        icon: '🌍',
        description: t('category.worldDesc'),
        count: genreCounts['World'] || 0
      }
    ].filter(cat => cat.count > 0) // Only show categories that have albums
    
  } catch (err) {
    console.error('Failed to load categories:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// 跳转到分类搜索页（搜索专辑）
const goToCategory = (category) => {
  router.push({
    path: '/search',
    query: { category: category.genre }
  })
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.page-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-base);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.category-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

.category-card:hover::before {
  transform: scaleX(1);
}

.category-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base);
}

.category-card:hover .category-icon {
  transform: scale(1.1) rotate(5deg);
}

.icon-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.category-name {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: bold;
}

.category-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  flex: 1;
}

.category-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.category-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.category-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  transition: transform var(--transition-base);
}

.category-card:hover .category-arrow {
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }

  .category-card {
    padding: var(--spacing-lg);
  }

  .category-icon {
    width: 60px;
    height: 60px;
  }

  .icon-emoji {
    font-size: 2rem;
  }
}

@media (max-width: 576px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>