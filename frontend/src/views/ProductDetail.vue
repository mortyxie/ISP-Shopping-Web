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
        <div class="care-only care-banner">
          <div class="title">🧾 {{ $t('careMode.productDetailTitle') }}</div>
          <div class="desc">
            {{ $t('careMode.productDetailDescription') }}
          </div>
        </div>
        <!-- 左侧：商品大图 with navigation buttons -->
        <div class="product-image-section">
          <div class="main-image-wrapper">
            <img :src="currentImage" :alt="productName" class="main-image" @error="handleMainImageError" />
            
            <!-- Navigation buttons -->
            <div class="image-nav care-hide" v-if="productImages.length > 1">
              <button class="nav-btn prev" @click="prevImage">‹</button>
              <button class="nav-btn next" @click="nextImage">›</button>
            </div>
            
            <!-- Image counter -->
            <div class="image-counter care-hide" v-if="productImages.length > 1">
              {{ currentIndex + 1 }} / {{ productImages.length }}
            </div>
          </div>
        </div>

        <!-- 右侧：商品信息 -->
        <div class="product-info-section">
          <h1 class="product-title">{{ productName }}</h1>
          
          <!-- 艺术家信息 -->
          <p class="product-artist">{{ productArtist }}</p>
          
          <!-- Product details - simplified -->
          <div class="product-details-simple">
            <div class="detail-row">
              <span class="detail-label">{{ $t('productDetail.condition') }}:</span>
              <span class="detail-value">{{ productConditionDisplay }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('productDetail.price') }}:</span>
              <span class="detail-value price">¥{{ productPrice.toFixed(2) }}</span>
            </div>
            <div class="detail-row description">
              <span class="detail-label">{{ $t('productDetail.description') }}:</span>
              <p class="detail-value">{{ productDescription }}</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions" v-if="!isSeller">
            <button
              class="btn-add-cart"
              @click="addToCart"
            >
              {{ $t('productDetail.addToCart') }}
            </button>
            <button
              class="btn-buy-now"
              @click="buyNow"
            >
              {{ $t('productDetail.buyNow') }}
            </button>
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
import { getRecordPlaceholder } from '../utils/recordPlaceholder'
import { addToCart as addItemToCart } from '../services/cartService'
import { getProduct } from '../services/productService'
import { isAuthenticated } from '../services/authService'
import { setCheckoutDraft } from '../services/orderService'
import { formatConditionLabel } from '../utils/conditionLabel'

const isSeller = ref(false)

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Loading and error states
const isLoading = ref(true)
const error = ref(null)

// Product data - simplified
const productId = computed(() => parseInt(route.params.id))
const productName = ref('')
const productArtist = ref('')
const productCondition = ref('')
const productConditionDisplay = computed(() => formatConditionLabel(t, productCondition.value))
const productPrice = ref(0)
const productDescription = ref('')

// Image gallery
const currentIndex = ref(0)
const productImages = ref([])
const currentImage = computed(() => {
  return productImages.value[currentIndex.value] || getRecordPlaceholder(productId.value || 1)
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
    const result = await addItemToCart(productId.value, 1)
    if (result.success) {
      alert(t('productDetail.addedToCart'))
      window.dispatchEvent(new Event('cartUpdated'))
    } else {
      alert(t('productDetail.addToCartError'))
    }
  } catch (error) {
    console.error('Failed to add to cart:', error)
    alert(t('productDetail.addToCartError'))
  }
}

// Buy Now
const buyNow = () => {
  if (!productId.value) {
    alert('Product not found')
    return
  }
  
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }

  // Create checkout draft with just this product
  const draft = {
    source: 'product',
    items: [
      {
        product_id: productId.value,
        price_at_purchase: productPrice.value,
        quantity: 1,
        name: productName.value,
        artist: productArtist.value,
        image: currentImage.value || productImage.value,
        condition: productCondition.value
      }
    ]
  }
  
  // Save to sessionStorage
  sessionStorage.setItem('checkout_draft', JSON.stringify(draft))
  
  // Go to checkout
  router.push('/checkout')
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
    productDescription.value =
      product.description ||
      `${formatConditionLabel(t, product.condition)} · ${t('productDetail.noDescription')}`
    
    // Handle product images
    if (product.image_urls) {
      try {
        const rawImages = typeof product.image_urls === 'string'
          ? JSON.parse(product.image_urls)
          : product.image_urls
        const usable = Array.isArray(rawImages)
          ? rawImages.filter((src) => typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http://') || src.startsWith('https://')))
          : []
        productImages.value = usable.length > 0 ? usable : [product.image || getRecordPlaceholder(productId.value || 1)]
      } catch (e) {
        console.error('Error parsing images:', e)
        productImages.value = [product.image || getRecordPlaceholder(productId.value || 1)]
      }
    } else {
      productImages.value = [product.image || getRecordPlaceholder(productId.value || 1)]
    }
    currentIndex.value = 0
    
  } catch (err) {
    console.error('Failed to load product:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

const handleMainImageError = (e) => {
  if (e?.target?.dataset?.fallbackApplied) return
  e.target.dataset.fallbackApplied = '1'
  e.target.src = getRecordPlaceholder(productId.value || 1)
}

onMounted(() => {
  if (!productId.value) {
    router.push('/')
    return
  }
  // Check if current user is a seller
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  isSeller.value = user.role === 'seller' || user.role === 'admin'
  console.log('Is seller:', isSeller.value)
  
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

/* Product details simple */
.product-details-simple {
  margin: var(--spacing-xl) 0;
  padding: var(--spacing-lg) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.detail-row {
  display: flex;
  margin-bottom: var(--spacing-md);
}

.detail-label {
  width: 100px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: var(--color-text-primary);
}

.detail-value.price {
  color: var(--color-primary);
  font-weight: bold;
  font-size: var(--font-size-xl);
}

.detail-row.description {
  flex-direction: column;
}

.detail-row.description .detail-label {
  width: 100%;
  margin-bottom: var(--spacing-xs);
}

.detail-row.description .detail-value {
  line-height: 1.6;
  margin: 0;
}

/* Action buttons */
.product-actions {
  margin-top: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
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

.btn-add-cart:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-buy-now {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-light);
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-buy-now:hover:not(:disabled) {
  background: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.seller-message {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-accent);
  border-radius: var(--border-radius-md);
  text-align: center;
  color: var(--color-text-secondary);
  border: 1px dashed var(--color-primary);
  font-size: var(--font-size-base);
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
    width: 30px;
    height: 30px;
    font-size: 18px;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: 100%;
    margin-bottom: var(--spacing-xs);
  }
}
</style>