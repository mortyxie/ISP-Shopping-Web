<template>
  <div class="album-detail-page">
    <div class="container">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="$router.push('/')" class="btn-primary">
          {{ $t('common.goBack') }}
        </button>
      </div>

      <!-- Album Content -->
      <div v-else>
        <!-- Album Header -->
        <div class="album-header">
          <div class="album-cover">
            <img :src="albumImage" :alt="albumTitle" class="cover-image" />
          </div>
          <div class="album-info">
            <h1 class="album-title">{{ albumTitle }}</h1>
            <p class="album-artist">{{ albumArtist }}</p>
            <p class="album-year">{{ albumYear }} • {{ albumGenre }}</p>
            <p class="album-stats">{{ totalProducts }} {{ $t('albumDetail.availableCopies') }}</p>
            
            <!-- Rating Section -->
            <div class="album-rating" v-if="reviewCount > 0">
              <div class="stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= Math.round(avgRating) }">★</span>
              </div>
              <span class="rating-count">{{ avgRating.toFixed(1) }} ({{ reviewCount }} {{ $t('albumDetail.reviews.summary.total') }})</span>
            </div>
            
            <div class="album-actions">
              <router-link :to="`/album/${albumId}/reviews`" class="view-reviews-btn">
                {{ $t('albumDetail.viewAllReviews') }} ({{ reviewCount }})
              </router-link>
            </div>
          </div>
        </div>

        <!-- Tracklist (if available) -->
        <div v-if="albumTracklist" class="tracklist-section">
          <h2 class="section-title">{{ $t('albumDetail.tracklist') }}</h2>
          <p class="tracklist">{{ albumTracklist }}</p>
        </div>

        <!-- Available Products by Condition -->
        <h2 class="section-title">{{ $t('albumDetail.availableCopies') }}</h2>
        
        <div v-if="products.length === 0" class="no-products">
          <p>{{ $t('albumDetail.noProducts') }}</p>
        </div>

        <div v-else class="conditions-container">
          <div
            v-for="condition in conditions"
            :key="condition"
            class="condition-group"
          >
            <div class="condition-header">
              <h3 class="condition-title">{{ $t(`albumDetail.conditions.${condition.toLowerCase().replace(' ', '')}`) || condition }}</h3>
              <span class="condition-count">{{ getProductsByCondition(condition).length }} {{ $t('albumDetail.conditions.copies') }}</span>
            </div>

            <div v-if="getProductsByCondition(condition).length === 0" class="no-items">
              <p>{{ $t('albumDetail.noItemsInCondition') }}</p>
            </div>

            <div v-else class="products-grid">
              <div
                v-for="product in getProductsByCondition(condition)"
                :key="product.id"
                class="product-card"
                @click="$router.push(`/product/${product.id}`)"
              >
                <div class="product-image">
                  <img 
                    :src="getProductImage(product)" 
                    :alt="albumTitle"
                    @error="handleImageError"
                  />
                </div>
                <div class="product-info">
                  <p class="product-condition">{{ $t(`albumDetail.conditions.${product.condition.toLowerCase().replace(' ', '')}`) || product.condition }}</p>
                  <p class="product-price">¥{{ product.price.toFixed(2) }}</p>
                  <p class="product-description">{{ product.description || $t('productDetail.noDescription') || 'No description' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAlbumWithProducts } from '../services/albumService'
import { getAlbumReviews, getAlbumAverageRating } from '../services/reviewService'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const isLoading = ref(true)
const error = ref(null)
const albumId = computed(() => parseInt(route.params.id))
const albumData = ref(null)
const albumTitle = ref('')
const albumArtist = ref('')
const albumImage = ref('')
const albumYear = ref('')
const albumGenre = ref('')
const albumTracklist = ref('')
const products = ref([])
const reviews = ref([])
const avgRating = ref(0)
const reviewCount = ref(0)

// Computed
const conditions = ['Mint', 'Near Mint', 'Good']
const totalProducts = computed(() => products.value.length)

// Helper functions
const getProductsByCondition = (condition) => {
  return products.value.filter(p => p.condition === condition)
}

const getProductImage = (product) => {
  if (product.image_urls) {
    try {
      const images = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls
      if (images && images.length > 0) return images[0]
    } catch (e) {}
  }
  return albumImage.value
}

const handleImageError = (e) => { e.target.src = albumImage.value }

// Load album data
const loadAlbum = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const data = await getAlbumWithProducts(albumId.value)
    albumData.value = data
    albumTitle.value = data.title
    albumArtist.value = data.artist
    albumImage.value = data.cover_image_url
    albumYear.value = data.release_year
    albumGenre.value = data.genre
    albumTracklist.value = data.tracklist
    products.value = data.products || []
    
    const fetchedReviews = await getAlbumReviews(albumId.value)
    reviews.value = fetchedReviews
    
    const ratingData = await getAlbumAverageRating(albumId.value)
    avgRating.value = ratingData.avg_rating || 0
    reviewCount.value = ratingData.review_count || 0
    
  } catch (err) {
    console.error('Failed to load album:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!albumId.value) {
    router.push('/')
    return
  }
  loadAlbum()
})
</script>

<style scoped>
.album-detail-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.loading-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
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

.error-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

/* Album Header */
.album-header {
  display: flex;
  gap: var(--spacing-xxl);
  margin-bottom: var(--spacing-xxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-primary);
}

.album-cover {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
}

.album-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.album-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-sm) 0;
  font-weight: bold;
}

.album-artist {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.album-year {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
}

.album-stats {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
  margin: var(--spacing-md) 0 0 0;
}

/* Rating Section */
.album-rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: var(--spacing-sm) 0;
}

.album-rating .stars {
  display: flex;
  gap: 2px;
}

.album-rating .star {
  font-size: var(--font-size-base);
  color: #d1d5db;
}

.album-rating .star.active {
  color: #f59e0b;
}

.rating-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Album Actions */
.album-actions {
  margin-top: var(--spacing-md);
}

.view-reviews-btn {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: bold;
  transition: all var(--transition-base);
  cursor: pointer;
}

.view-reviews-btn:hover {
  background: var(--color-primary);
  color: white;
}

/* Tracklist */
.tracklist-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xxl);
  box-shadow: var(--shadow-md);
  border-left: 4px solid var(--color-primary);
}

.tracklist {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.8;
  margin: 0;
  white-space: pre-line;
}

.section-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-lg) 0;
  font-weight: bold;
}

/* Conditions */
.conditions-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.condition-group {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
}

.condition-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin: 0;
  font-weight: bold;
}

.condition-count {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
}

.no-items {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.product-card {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  border: 1px solid var(--color-border);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: var(--spacing-md);
}

.product-condition {
  font-size: var(--font-size-base);
  color: var(--color-primary);
  font-weight: bold;
  margin: 0 0 var(--spacing-xs) 0;
}

.product-price {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: bold;
  margin: 0 0 var(--spacing-xs) 0;
}

.product-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-products {
  text-align: center;
  padding: var(--spacing-xxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .album-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>