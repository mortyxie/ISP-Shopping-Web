<template>
  <div class="product-detail-page">
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

      <!-- Product Content -->
      <div v-else class="product-main">
        <!-- 左侧：商品大图 with navigation buttons -->
        <div class="product-image-section">
          <div class="main-image-wrapper">
            <img :src="currentImage" :alt="productName" class="main-image" />
            
            <!-- Navigation buttons -->
            <div class="image-nav" v-if="productImages.length > 1">
              <button class="nav-btn prev" @click="prevImage">‹</button>
              <button class="nav-btn next" @click="nextImage">›</button>
            </div>
            
            <!-- Image counter -->
            <div class="image-counter" v-if="productImages.length > 1">
              {{ currentIndex + 1 }} / {{ productImages.length }}
            </div>
          </div>
        </div>

        <!-- 右侧：商品信息 -->
        <div class="product-info-section">
          <h1 class="product-title">{{ productName }}</h1>
          
          <!-- 艺术家信息 -->
          <p class="product-artist">{{ productArtist }}</p>
          
          <!-- 商品成色 -直接显示，无选择 -->
          <div class="product-condition-display">
            <span class="condition-label">Condition:</span>
            <span class="condition-value">{{ productCondition }}</span>
          </div>
          
          <!-- 商品价格 -->
          <div class="product-price-display">
            <span class="price-label">Price:</span>
            <span class="price-value">¥{{ productPrice.toFixed(2) }}</span>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions">
            <button
              class="btn-add-cart"
              @click="addToCart"
            >
              {{ $t('productDetail.addToCart') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 下方：商品描述 -->
      <div class="product-description-section">
        <h2 class="description-title">{{ $t('productDetail.description') }}</h2>
        <div class="description-content">
          <p>{{ productDescription }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { addToCart as addItemToCart } from '../services/cartService'
import { getProduct } from '../services/productService'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Loading and error states
const isLoading = ref(true)
const error = ref(null)

// Product data
const productId = computed(() => parseInt(route.params.id))
const productName = ref('')
const productArtist = ref('')
const productCondition = ref('')
const productPrice = ref(0)
const productDescription = ref('')

// Image gallery
const currentIndex = ref(0)
const productImages = ref([])
const currentImage = computed(() => {
  return productImages.value[currentIndex.value] || ''
})

// Image navigation functions
const nextImage = () => {
  if (productImages.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % productImages.value.length
}

const prevImage = () => {
  if (productImages.value.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + productImages.value.length) % productImages.value.length
}

// Add to cart
const addToCart = async () => {
  try {
    await addItemToCart(productId.value, 1)
    alert(t('productDetail.addedToCart'))
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (error) {
    console.error('Failed to add to cart:', error)
    alert(t('productDetail.addToCartError'))
  }
}

// Load product data from backend
const loadProduct = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    console.log(`Loading product ID: ${productId.value}`)
    const product = await getProduct(productId.value)
    console.log('Product data:', product)
    
    productName.value = product.name
    productArtist.value = product.artist
    productCondition.value = product.condition
    productPrice.value = product.price
    productDescription.value = product.description || `${product.condition} condition copy`
    
    // Handle product images - use the same image_urls from database
    if (product.image_urls) {
      try {
        // Parse the JSON array of images (same format saved from SellerDashboard)
        productImages.value = typeof product.image_urls === 'string' 
          ? JSON.parse(product.image_urls) 
          : product.image_urls
        console.log('Product images from database:', productImages.value)
      } catch (e) {
        console.error('Error parsing images:', e)
        productImages.value = [product.image] // Fallback to album cover
      }
    } else {
      // No images uploaded, use album cover as fallback
      productImages.value = [product.image]
      console.log('No product images, using album cover')
    }
    currentIndex.value = 0
    
  } catch (err) {
    console.error('Failed to load product:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!productId.value) {
    router.push('/')
    return
  }
  loadProduct()
})
</script>

<style scoped>
.product-detail-page {
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

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xxl);
  margin-bottom: var(--spacing-xxl);
}

/* Image Section */
.product-image-section {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.main-image-wrapper {
  position: relative;
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.main-image {
  width: 100%;
  height: auto;
  border-radius: var(--border-radius-md);
  display: block;
}

/* Navigation buttons */
.image-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  pointer-events: none;
  z-index: 10;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.nav-btn:hover {
  background: var(--color-primary);
  color: white;
  transform: scale(1.1);
}

.image-counter {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 10;
}

/* Product Info Section */
.product-info-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.product-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: bold;
}

.product-artist {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

/* Product details display */
.product-condition-display,
.product-price-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.condition-label,
.price-label {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.condition-value {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  font-weight: bold;
}

.price-value {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  font-weight: bold;
}

/* Action button */
.product-actions {
  margin-top: var(--spacing-xl);
}

.btn-add-cart {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-add-cart:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Description Section */
.product-description-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border-top: 4px solid var(--color-primary);
}

.description-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
}

.description-content {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.8;
}

.description-content p {
  margin: 0;
}

/* Responsive */
@media (max-width: 992px) {
  .product-main {
    grid-template-columns: 1fr;
  }

  .product-image-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .nav-btn {
    width: 35px;
    height: 35px;
    font-size: 24px;
  }
}
</style>