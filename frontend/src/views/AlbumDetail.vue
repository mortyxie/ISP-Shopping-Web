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
          <!-- Group products by condition -->
          <div
            v-for="condition in conditions"
            :key="condition"
            class="condition-group"
          >
            <div class="condition-header">
              <h3 class="condition-title">{{ condition }}</h3>
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
                  <p class="product-condition">{{ product.condition }}</p>
                  <p class="product-price">¥{{ product.price.toFixed(2) }}</p>
                  <p class="product-description">{{ product.description || 'No description' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="reviews-section">
          <h2 class="section-title">{{ $t('albumDetail.reviews.title') }}</h2>

          <div class="reviews-summary" v-if="reviews.length">
            <div class="avg">
              <div class="avg-score">{{ avgRating.toFixed(1) }}</div>
              <div class="avg-stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= Math.round(avgRating) }">★</span>
              </div>
              <div class="count">{{ reviews.length }} {{ $t('albumDetail.reviews.summary.total') }}</div>
            </div>
          </div>

          <div class="review-form panel" v-if="isLoggedIn && canReview">
            <h3 class="panel-title">{{ $t('albumDetail.reviews.form.title') }}</h3>

            <div class="form-row">
              <div class="label">{{ $t('albumDetail.reviews.form.selectSku') }}</div>
              <select class="select" v-model="selectedPurchaseKey">
                <option value="" disabled>{{ $t('albumDetail.reviews.form.selectPlaceholder') }}</option>
                <option v-for="p in eligiblePurchases" :key="p.key" :value="p.key">
                  {{ formatTime(p.purchased_at) }} · {{ p.condition }} · {{ $t('albumDetail.reviews.productId') }}: {{ p.product_id }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="label">{{ $t('albumDetail.reviews.form.rating') }}</div>
              <div class="stars">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  class="star-btn"
                  :class="{ on: i <= rating }"
                  @click="rating = i"
                >
                  ★
                </button>
                <span class="hint">{{ rating }}/5</span>
              </div>
            </div>

            <div class="form-row">
              <div class="label">{{ $t('albumDetail.reviews.form.comment') }}</div>
              <textarea
                class="textarea"
                v-model="comment"
                rows="4"
                :placeholder="$t('albumDetail.reviews.form.commentPlaceholder')"
              />
            </div>

            <div class="form-actions">
              <button class="btn-primary" :disabled="submitting" @click="submitReview">
                {{ submitting ? $t('albumDetail.reviews.form.submitting') : $t('albumDetail.reviews.form.submit') }}
              </button>
            </div>
          </div>

          <div v-if="reviews.length === 0" class="no-reviews">
            {{ $t('albumDetail.reviews.noReviews') }}
          </div>

          <div v-else class="reviews-list">
            <div v-for="r in reviews" :key="r.review_id" class="review-card">
              <div class="review-top">
                <div class="user">
                  <div class="avatar">{{ (r.username || 'U').slice(0, 1).toUpperCase() }}</div>
                  <div class="meta">
                    <div class="name">{{ maskName(r.username) }}</div>
                    <div class="time">{{ formatTime(r.created_at) }}</div>
                  </div>
                </div>
                <div class="rating">
                  <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= r.rating }">★</span>
                </div>
              </div>

              <div class="review-body">
                <div class="purchase">
                  {{ $t('albumDetail.reviews.purchaseInfo') }}：{{ r.purchased_at ? formatTime(r.purchased_at) : '-' }}
                  · {{ $t('albumDetail.reviews.sku') }}：{{ r.sku_condition || '-' }}（{{ $t('albumDetail.reviews.productId') }}: {{ r.product_id }}）
                </div>
                <div class="comment">{{ r.comment }}</div>
              </div>

              <div class="merchant-reply" v-if="r.merchant_reply">
                <div class="tag">{{ $t('albumDetail.reviews.merchantReply') }}</div>
                <div class="reply-content">{{ r.merchant_reply.content }}</div>
                <div class="reply-time">{{ formatTime(r.merchant_reply.reply_at) }}</div>
              </div>
              <div class="merchant-reply muted" v-else>
                {{ $t('albumDetail.reviews.noReply') }}
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
import { isAuthenticated } from '../services/authService'
import { getPurchaseRecordsForCurrentUser } from '../services/orderService'
import { addAlbumReview, getAlbumReviews, hasUserReviewedProduct } from '../services/reviewService'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

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

const submitting = ref(false)
const selectedPurchaseKey = ref('')
const rating = ref(0)
const comment = ref('')

// Available conditions
const conditions = ['Mint', 'Near Mint', 'Good']

// Total products count
const totalProducts = computed(() => products.value.length)

const isLoggedIn = computed(() => isAuthenticated())

const albumProductIds = computed(() => new Set(products.value.map((p) => p.id)))

const purchasesForThisAlbum = computed(() => {
  const records = getPurchaseRecordsForCurrentUser()
  return records.filter((r) => albumProductIds.value.has(r.product_id))
})

// FIX: Make this an async computed or ref that updates
const eligiblePurchases = ref([])

const canReview = computed(() => eligiblePurchases.value.length > 0)

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return reviews.value.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.value.length
})

// Get products by condition
const getProductsByCondition = (condition) => {
  return products.value.filter(p => p.condition === condition)
}

// Load album data
const loadAlbum = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    console.log(`Loading album ID: ${albumId.value}`)
    const data = await getAlbumWithProducts(albumId.value)
    console.log('Album data:', data)
    
    albumData.value = data
    albumTitle.value = data.title
    albumArtist.value = data.artist
    albumImage.value = data.cover_image_url
    albumYear.value = data.release_year
    albumGenre.value = data.genre
    albumTracklist.value = data.tracklist
    products.value = data.products || []
    
    // FIX: Await the async getAlbumReviews
    const fetchedReviews = await getAlbumReviews(albumId.value)
    reviews.value = fetchedReviews
    
    // FIX: Calculate eligible purchases after products are loaded
    await updateEligiblePurchases()
    
  } catch (err) {
    console.error('Failed to load album:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// FIX: Add function to update eligible purchases
const updateEligiblePurchases = async () => {
  const purchases = purchasesForThisAlbum.value
  const eligible = []
  
  for (const p of purchases) {
    const hasReviewed = await hasUserReviewedProduct(p.product_id)
    if (!hasReviewed) {
      eligible.push({
        ...p,
        key: `${p.order_id}_${p.product_id}`
      })
    }
  }
  
  eligiblePurchases.value = eligible
}

onMounted(() => {
  if (!albumId.value) {
    router.push('/')
    return
  }
  loadAlbum()
})

// Get the first product image or fallback to album cover
const getProductImage = (product) => {
  if (product.image_urls) {
    try {
      const images = typeof product.image_urls === 'string' 
        ? JSON.parse(product.image_urls) 
        : product.image_urls;
      if (images && images.length > 0) {
        return images[0];
      }
    } catch (e) {
      console.error('Error parsing product images:', e);
    }
  }
  return albumImage.value;
};

// Handle image load error
const handleImageError = (e) => {
  e.target.src = albumImage.value;
};

const formatTime = (iso) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return String(iso)
  }
}

const maskName = (name) => {
  const s = String(name || '')
  if (s.length <= 1) return '用户'
  if (s.length === 2) return `${s[0]}*`
  return `${s[0]}***${s[s.length - 1]}`
}

const submitReview = async () => {
  if (submitting.value) return
  if (!selectedPurchaseKey.value) {
    alert('请先选择购买的 SKU')
    return
  }

  const purchase = eligiblePurchases.value.find((p) => p.key === selectedPurchaseKey.value)
  if (!purchase) {
    alert('该 SKU 不可评价（可能已评价或不属于该专辑）')
    return
  }

  submitting.value = true
  try {
    const res = await addAlbumReview({
      album_id: albumId.value,
      product_id: purchase.product_id,
      rating: rating.value,
      comment: comment.value,
      purchased_at: purchase.purchased_at,
      sku_condition: purchase.condition
    })
    
    if (!res.success) {
      alert(res.message || '提交失败')
      return
    }

    // reset form
    selectedPurchaseKey.value = ''
    rating.value = 0
    comment.value = ''

    // reload reviews
    const fetchedReviews = await getAlbumReviews(albumId.value)
    reviews.value = fetchedReviews
    
    // update eligible purchases
    await updateEligiblePurchases()
    
  } finally {
    submitting.value = false
  }
}
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

/* Reviews */
.reviews-section {
  margin-top: var(--spacing-xxl);
}

.reviews-summary {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-lg);
}

.avg {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-md);
}

.avg-score {
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1;
}

.avg-stars .star,
.rating .star {
  color: #d1d5db;
}

.star.on {
  color: #f59e0b;
}

.count {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.review-form.panel {
  margin-bottom: var(--spacing-xl);
}

.form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.form-row .label {
  font-weight: 700;
  color: var(--color-text-primary);
}

.select,
.textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  outline: none;
  background: white;
}

.textarea {
  resize: vertical;
}

.select:focus,
.textarea:focus {
  border-color: rgba(220, 38, 38, 0.35);
}

.stars {
  display: flex;
  align-items: center;
  gap: 6px;
}

.star-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.2rem;
  color: #d1d5db;
  padding: 0;
}

.star-btn.on {
  color: #f59e0b;
}

.hint {
  margin-left: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.muted {
  color: var(--color-text-secondary);
}

.no-reviews {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
}

.reviews-list {
  display: grid;
  gap: var(--spacing-lg);
}

.review-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.user {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: var(--color-primary);
  font-weight: 900;
}

.meta .name {
  font-weight: 800;
  color: var(--color-text-primary);
}

.meta .time {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.review-body {
  margin-top: var(--spacing-md);
}

.purchase {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.comment {
  color: var(--color-text-primary);
  line-height: 1.8;
  white-space: pre-line;
}

.merchant-reply {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
}

.merchant-reply .tag {
  font-weight: 900;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.merchant-reply .reply-time {
  margin-top: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .avg {
    grid-template-columns: auto 1fr;
    grid-auto-rows: auto;
  }
}

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