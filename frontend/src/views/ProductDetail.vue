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
        <!-- 左侧：商品大图 -->
        <div class="product-image-section">
          <div class="main-image-wrapper">
            <img :src="productImage" :alt="productName" class="main-image" />
          </div>
        </div>

        <!-- 右侧：成色选择和商品列表 -->
        <div class="product-info-section">
          <h1 class="product-title">{{ productName }}</h1>
          
          <!-- 艺术家信息 -->
          <p class="product-artist">{{ productArtist }}</p>
          
          <!-- 成色类别选择 -->
          <div class="condition-selector">
            <h3 class="selector-title">{{ $t('productDetail.selectCondition') }}</h3>
            <div class="condition-tabs">
              <button
                v-for="condition in availableConditions"
                :key="condition.condition"
                class="condition-tab"
                :class="{ 
                  active: selectedCondition === condition.condition,
                  'out-of-stock': condition.count === 0 
                }"
                @click="selectCondition(condition.condition)"
                :disabled="condition.count === 0"
              >
                <span class="condition-label">{{ condition.condition }}</span>
                <span class="item-count">({{ condition.count }})</span>
                <span v-if="condition.count > 0" class="stock-badge in-stock">
                  {{ $t('productDetail.inStock') }}
                </span>
                <span v-else class="stock-badge out-of-stock">
                  {{ $t('productDetail.outOfStock') }}
                </span>
              </button>
            </div>
          </div>

          <!-- 商品列表 -->
          <div class="product-variants">
            <h3 class="variants-title">{{ $t('productDetail.availableItems') }}</h3>
            <div v-if="currentProducts.length === 0" class="no-variants">
              {{ $t('productDetail.noItems') }}
            </div>
            <div v-else class="variants-list">
              <div
                v-for="product in currentProducts"
                :key="product.id"
                class="variant-item"
                :class="{ selected: selectedProduct?.id === product.id }"
                @click="selectProduct(product)"
              >
                <div class="variant-info">
                  <span class="variant-condition">{{ product.condition }}</span>
                  <span class="variant-price">¥{{ product.price.toFixed(2) }}</span>
                </div>
                <div class="variant-description" v-if="product.description">
                  {{ product.description }}
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions" v-if="selectedProduct">
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
              立即购买
            </button>
          </div>
        </div>
      </div>

      <!-- 下方：商品描述 -->
      <div class="product-description-section" v-if="selectedProduct && !isLoading && !error">
        <h2 class="description-title">{{ $t('productDetail.description') }}</h2>
        <div class="description-content">
          <p>{{ selectedProduct.description }}</p>
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
import { isAuthenticated } from '../services/authService'
import { setCheckoutDraft } from '../services/orderService'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Loading and error states
const isLoading = ref(true)
const error = ref(null)

// Product data
const productId = computed(() => parseInt(route.params.id))
const productData = ref(null)
const productName = ref('')
const productArtist = ref('')
const productImage = ref('')
const allProducts = ref([])

// Selected condition and product
const selectedCondition = ref('')
const selectedProduct = ref(null)

// Get unique conditions with counts
const availableConditions = computed(() => {
  const conditionMap = new Map()
  
  allProducts.value.forEach(product => {
    const condition = product.condition
    conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1)
  })
  
  return Array.from(conditionMap.entries()).map(([condition, count]) => ({
    condition,
    count
  }))
})

// Get products for selected condition
const currentProducts = computed(() => {
  if (!selectedCondition.value) return []
  return allProducts.value.filter(p => p.condition === selectedCondition.value)
})

// Select condition
const selectCondition = (condition) => {
  selectedCondition.value = condition
  selectedProduct.value = currentProducts.value[0] || null
}

// Select product
const selectProduct = (product) => {
  selectedProduct.value = product
}

// Add to cart
const addToCart = async () => {
  if (!selectedProduct.value) return
  
  try {
    const result = await addItemToCart(selectedProduct.value.id)
    if (result.success) {
      alert(t('productDetail.addedToCart'))
      window.dispatchEvent(new Event('cartUpdated'))
    } else {
      if (result.error === 'Item already in cart') {
        alert('This item is already in your cart')
      } else {
        alert(t('productDetail.addToCartError'))
      }
    }
  } catch (error) {
    console.error('Failed to add to cart:', error)
    alert(t('productDetail.addToCartError'))
  }
}

const buyNow = () => {
  if (!selectedProduct.value) return
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }

  setCheckoutDraft({
    source: 'product',
    items: [
      {
        product_id: selectedProduct.value.id,
        price_at_purchase: selectedProduct.value.price,
        quantity: 1,
        name: productName.value,
        artist: productArtist.value,
        image: productImage.value,
        condition: selectedProduct.value.condition
      }
    ]
  })
  router.push('/checkout')
}

// Load product data
const loadProduct = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    console.log(`Loading product ID: ${productId.value}`)
    
    // Get the current product
    const product = await getProduct(productId.value)
    console.log('Product data:', product)
    
    productData.value = product
    productName.value = product.name
    productArtist.value = product.artist
    productImage.value = product.image
    
    // Since we don't have all products for this album yet,
    // we'll just show this single product for now
    allProducts.value = [{
      id: product.id,
      condition: product.condition,
      price: product.price,
      description: product.description || `${product.condition} condition copy`
    }]
    
    // Set default selections
    if (availableConditions.value.length > 0) {
      selectedCondition.value = availableConditions.value[0].condition
      if (currentProducts.value.length > 0) {
        selectedProduct.value = currentProducts.value[0]
      }
    }
    
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

.product-image-section {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.main-image-wrapper {
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
}

.condition-selector {
  margin-bottom: var(--spacing-xl);
}

.selector-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.condition-tabs {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.condition-tab {
  padding: var(--spacing-md) var(--spacing-lg);
  padding-bottom: 30px;
  border: 2px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
  font-weight: 500;
  position: relative;
  min-width: 100px;
}

.condition-tab:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-accent);
}

.condition-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.condition-tab.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-count {
  font-size: var(--font-size-sm);
  opacity: 0.8;
  margin-left: 4px;
}

.stock-badge {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.stock-badge.in-stock {
  background-color: var(--color-success);
  color: white;
}

.stock-badge.out-of-stock {
  background-color: var(--color-error);
  color: white;
}

.product-variants {
  margin-bottom: var(--spacing-xl);
}

.variants-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.no-variants {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.variants-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.variant-item {
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-bg);
}

.variant-item:hover {
  border-color: var(--color-primary);
  background: var(--color-accent);
  transform: translateX(4px);
}

.variant-item.selected {
  border-color: var(--color-primary);
  background: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.variant-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.variant-condition {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.variant-price {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.variant-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

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

.btn-add-cart:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-add-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-buy-now {
  width: 100%;
  margin-top: var(--spacing-md);
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

@media (max-width: 992px) {
  .product-main {
    grid-template-columns: 1fr;
  }

  .product-image-section {
    position: static;
  }
}

@media (max-width: 767.98px) {
  .condition-tabs {
    flex-direction: column;
  }

  .condition-tab {
    width: 100%;
  }
}
</style>