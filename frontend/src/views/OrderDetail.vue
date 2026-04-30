<template>
  <div class="order-detail-page">
    <div class="container">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadOrder" class="btn-primary">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- Order Details -->
      <div v-else-if="order" class="order-content">
        <div class="order-header">
          <h1 class="page-title">{{ $t('orderDetail.title') }} #{{ order.id }}</h1>
          <router-link :to="isSellerView ? '/seller?tab=orders' : '/orders'" class="back-link">
            ← {{ isSellerView ? $t('orderDetail.backToSeller') : $t('orderDetail.backToList') }}
          </router-link>
        </div>

        <!-- Timeline Card -->
        <div class="timeline-card">
          <h2>{{ $t('orderDetail.timeline.title') }}</h2>
          <div class="timeline">
            <div class="timeline-item" :class="{ active: order.created_at }">
              <div class="timeline-icon">📝</div>
              <div class="timeline-content">
                <div class="timeline-title">{{ $t('orderDetail.timeline.placed') }}</div>
                <div class="timeline-date">{{ formatDateTime(order.created_at) }}</div>
              </div>
            </div>
            
            <div class="timeline-item" :class="{ active: order.paid_at }">
              <div class="timeline-icon">💰</div>
              <div class="timeline-content">
                <div class="timeline-title">{{ $t('orderDetail.timeline.payment') }}</div>
                <div class="timeline-date">{{ formatDateTime(order.paid_at) || $t('orderDetail.timeline.pending') }}</div>
              </div>
            </div>
            
            <div class="timeline-item" :class="{ active: order.shipped_at }">
              <div class="timeline-icon">📦</div>
              <div class="timeline-content">
                <div class="timeline-title">{{ $t('orderDetail.timeline.shipped') }}</div>
                <div class="timeline-date">{{ formatDateTime(order.shipped_at) || $t('orderDetail.timeline.notYet') }}</div>
              </div>
            </div>
            
            <div class="timeline-item" :class="{ active: order.completed_at }">
              <div class="timeline-icon">✅</div>
              <div class="timeline-content">
                <div class="timeline-title">{{ $t('orderDetail.timeline.delivered') }}</div>
                <div class="timeline-date">{{ formatDateTime(order.completed_at) || $t('orderDetail.timeline.notYet') }}</div>
              </div>
            </div>
            
            <div v-if="order.cancelled_at" class="timeline-item cancelled active">
              <div class="timeline-icon">❌</div>
              <div class="timeline-content">
                <div class="timeline-title">{{ $t('orderDetail.timeline.cancelled') }}</div>
                <div class="timeline-date">{{ formatDateTime(order.cancelled_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Status Card -->
        <div class="status-card">
          <div class="status-info">
            <span class="status-label">{{ $t('orderDetail.status') }}:</span>
            <span class="order-status" :class="order.status">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          <div class="date-info">
            <span class="date-label">{{ $t('orderDetail.orderDate') }}:</span>
            <span class="date-value">{{ formatDate(order.created_at) }}</span>
          </div>
        </div>

        <!-- Shipping Information -->
        <div class="shipping-card">
          <h2>{{ $t('orderDetail.shippingInfo') }}</h2>
          <div class="shipping-details">
            <p><strong>{{ $t('orderDetail.address') }}:</strong> {{ order.shipping_address }}</p>
            <p><strong>{{ $t('orderDetail.paymentMethod') }}:</strong> {{ order.payment_method || $t('orderDetail.notSpecified') }}</p>
            <p v-if="order.transaction_id"><strong>{{ $t('orderDetail.transactionId') }}:</strong> {{ order.transaction_id }}</p>
            <p v-if="order.paid_at"><strong>{{ $t('orderDetail.paidAt') }}:</strong> {{ formatDate(order.paid_at) }}</p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="items-card">
          <h2>{{ $t('orderDetail.orderItems') }}</h2>
          <div class="items-list">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="order-item"
              :class="{ clickable: !!item.album_id }"
              @click="goToAlbum(item.album_id)"
            >
              <img :src="item.image" :alt="item.name" class="item-image">
              <div class="item-details">
                <h3>{{ item.name }}</h3>
                <p class="item-condition">{{ formatCondition(item.condition) }}</p>
                <p class="item-price">¥{{ formatMoney(item.price) }} x {{ item.quantity }}</p>
                <p class="item-id">Product ID: {{ item.id }}</p>
              </div>
              <div class="item-subtotal">
                <span class="subtotal-label">{{ $t('orderDetail.subtotal') }}:</span>
                <span class="subtotal-value">¥{{ formatMoney(toNumber(item.price) * toNumber(item.quantity)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="summary-card">
          <div class="summary-row">
            <span>{{ $t('orderDetail.subtotal') }}:</span>
            <span>¥{{ formatMoney(order.subtotal || 0) }}</span>
          </div>
          <div class="summary-row">
            <span>{{ $t('orderDetail.shipping') }}:</span>
            <span>¥{{ formatMoney(order.shipping_cost || 0) }}</span>
          </div>
          <div class="summary-row total">
            <span>{{ $t('orderDetail.total') }}:</span>
            <span class="total-price">¥{{ formatMoney(toNumber(order.subtotal || 0) + toNumber(order.shipping_cost || 0)) }}</span>
          </div>
        </div>

        <!-- Write Review Section - Show each product individually -->
        <div class="write-review-section" v-if="!isSellerView && order.status === 'completed'">
          <h3>{{ $t('orderDetail.review.title') }}</h3>
          
          <!-- Show each product individually - NEVER combine them -->
          <div class="products-review-list">
            <div v-for="item in order.items" :key="item.id" class="product-review-card">
              <div class="product-info-box">
                <div class="product-image-small">
                  <img :src="item.image" :alt="item.name">
                </div>
                <div class="product-details">
                  <p class="product-name">{{ item.name }}</p>
                  <p class="product-condition">{{ $t('orderDetail.review.version') }}: {{ formatCondition(item.condition) }}</p>
                  <p class="product-id-text">Product ID: {{ item.id }}</p>
                </div>
              </div>
              
              <!-- If product is already reviewed -->
              <div v-if="reviewedProducts.has(item.id)" class="already-reviewed-box">
                <div class="already-reviewed-message">
                  <p>✅ {{ $t('orderDetail.review.alreadyReviewed') }}</p>
                  <button class="btn-view-review" @click="goToProductReviewPage(item.id, item.album_id)">
                    {{ $t('orderDetail.review.viewReview') }}
                  </button>
                </div>
              </div>
              
              <!-- If product is not reviewed yet -->
              <div v-else class="review-input-area">
                <div class="form-group">
                  <label>{{ $t('orderDetail.review.rating') }}</label>
                  <div class="star-rating">
                    <button 
                      v-for="i in 5" 
                      :key="i" 
                      class="star-btn" 
                      :class="{ active: i <= productRatings[item.id] }" 
                      @click="productRatings[item.id] = i"
                    >
                      ★
                    </button>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>{{ $t('orderDetail.review.comment') }}</label>
                  <textarea 
                    v-model="productComments[item.id]" 
                    rows="4" 
                    :placeholder="$t('orderDetail.review.commentPlaceholder')" 
                    class="form-control"
                  ></textarea>
                </div>
                
                <button 
                  class="btn-submit-review" 
                  :disabled="submitting || productRatings[item.id] === 0 || !productComments[item.id]?.trim()"
                  @click="submitReviewForProduct(item.id)"
                >
                  {{ submitting ? $t('orderDetail.review.submitting') : $t('orderDetail.review.submit') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons" v-if="!isSellerView">
          <button 
            v-if="order.status === 'pending'" 
            class="btn-primary pay-btn" 
            @click="payOrder"
          >
            💰 {{ $t('orderDetail.payNow') }}
          </button>
          <button 
            v-if="order.status === 'pending'" 
            class="btn-secondary" 
            @click="cancelOrder"
          >
            {{ $t('orderDetail.cancelOrder') }}
          </button>
          <button 
            v-if="order.status === 'shipped'" 
            class="btn-primary" 
            @click="confirmReceipt"
          >
            {{ $t('orderDetail.confirmReceipt') }}
          </button>
        </div>

        <!-- Seller View Message -->
        <div v-if="isSellerView" class="seller-view-message">
          {{ $t('orderDetail.sellerView') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAuthenticated } from '../services/authService'
import { submitReview } from '../services/reviewService'
import { formatConditionLabel } from '../utils/conditionLabel'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const formatCondition = (c) => formatConditionLabel(t, c)

// Order state
const order = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isSellerView = ref(false)

// Review state
const submitting = ref(false)
const reviewedProducts = ref(new Set())
const productRatings = reactive({})
const productComments = reactive({})

const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const formatMoney = (v) => toNumber(v).toFixed(2)

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load order from API
const loadOrder = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const orderId = route.params.id
    const token = localStorage.getItem('token')
    const isSeller = route.query.seller === 'true'
    
    const endpoint = isSeller 
      ? `/api/seller/orders/${orderId}` 
      : `/api/orders/${orderId}`
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to load order')
    }
    
    order.value = await response.json()
    isSellerView.value = isSeller
    
    await checkReviewStatus()
    
  } catch (err) {
    console.error('Failed to load order:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// Check which products have been reviewed
const checkReviewStatus = async () => {
  if (order.value && order.value.status === 'completed' && order.value.items) {
    try {
      const token = localStorage.getItem('token')
      const orderId = order.value.id
      
      console.log('Fetching reviews for order:', orderId)
      
      const response = await fetch(`/api/reviews/user/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Reviews data received:', data)
        
        reviewedProducts.value.clear()
        
        if (data.reviewedProducts && Array.isArray(data.reviewedProducts)) {
          data.reviewedProducts.forEach(productId => {
            console.log('Adding product to reviewed set:', productId)
            reviewedProducts.value.add(parseInt(productId))
          })
        }
        
        console.log('Final reviewed products Set:', Array.from(reviewedProducts.value))
        
        // Initialize ratings and comments for unreviewed products
        if (order.value.items) {
          order.value.items.forEach(item => {
            if (!reviewedProducts.value.has(item.id)) {
              productRatings[item.id] = 0
              productComments[item.id] = ''
            }
          })
        }
      } else {
        console.error('Failed to fetch reviews:', response.status)
      }
    } catch (error) {
      console.error('Error checking review status:', error)
    }
  }
}

// Submit review for a specific product
const submitReviewForProduct = async (productId) => {
  if (productRatings[productId] === 0) {
    alert(t('orderDetail.review.errors.noRating'))
    return
  }
  if (!productComments[productId]?.trim()) {
    alert(t('orderDetail.review.errors.noComment'))
    return
  }
  
  submitting.value = true
  try {
    const res = await submitReview(productId, order.value.id, productRatings[productId], productComments[productId].trim())
    if (res.success) {
      reviewedProducts.value.add(productId)
      productRatings[productId] = 0
      productComments[productId] = ''
      alert(t('orderDetail.review.success.reviewSubmitted'))
      await checkReviewStatus()
    } else {
      alert(res.message || t('orderDetail.review.errors.submitFailed'))
    }
  } catch (error) {
    console.error('Failed to submit review:', error)
    alert(t('orderDetail.review.errors.submitFailed'))
  } finally {
    submitting.value = false
  }
}

// Go to album review page for a specific product
const goToProductReviewPage = async (productId, albumId) => {
  try {
    // If we have album_id directly from the product, use it
    if (albumId) {
      router.push(`/album/${albumId}/reviews`)
      return
    }
    
    // Otherwise fetch the product to get album_id
    const response = await fetch(`/api/products/${productId}`)
    if (!response.ok) {
      alert(t('orderDetail.review.errors.noAlbumFound'))
      return
    }
    
    const productData = await response.json()
    console.log('Product data for review page:', productData)
    
    if (productData.album_id) {
      router.push(`/album/${productData.album_id}/reviews`)
    } else {
      alert(t('orderDetail.review.errors.noAlbumFound'))
    }
  } catch (err) {
    console.error('Failed to get product info:', err)
    alert(t('orderDetail.review.errors.loadFailed'))
  }
}

const goToAlbum = (albumId) => {
  if (!albumId) return
  router.push(`/album/${albumId}`)
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get status text
const getStatusText = (status) => {
  const statusMap = {
    'pending': t('orders.status.pending'),
    'paid': t('orders.status.paid'),
    'shipped': t('orders.status.shipped'),
    'completed': t('orders.status.completed'),
    'cancelled': t('orders.status.cancelled')
  }
  return statusMap[status] || status
}

// Pay order
const payOrder = async () => {
  if (!confirm(t('orderDetail.confirmPayment'))) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${order.value.id}/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      alert(t('orderDetail.paymentSuccess'))
      await loadOrder()
    } else {
      alert(t('orderDetail.paymentFailed') + (data.error || ''))
    }
  } catch (err) {
    console.error('Payment error:', err)
    alert(t('orderDetail.paymentFailed'))
  }
}

// Cancel order
const cancelOrder = async () => {
  if (!confirm(t('orderDetail.confirmCancel'))) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${order.value.id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      alert(t('orderDetail.cancelSuccess'))
      await loadOrder()
    } else {
      const data = await response.json()
      alert(data.error || t('orderDetail.cancelFailed'))
    }
  } catch (err) {
    console.error('Failed to cancel order:', err)
    alert(t('orderDetail.cancelFailed'))
  }
}

// Confirm receipt
const confirmReceipt = async () => {
  if (!confirm(t('orderDetail.confirmReceiptMsg'))) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${order.value.id}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      alert(t('orderDetail.confirmSuccess'))
      await loadOrder()
    } else {
      const data = await response.json()
      alert(data.error || t('orderDetail.confirmFailed'))
    }
  } catch (err) {
    console.error('Failed to confirm receipt:', err)
    alert(t('orderDetail.confirmFailed'))
  }
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadOrder()
})
</script>

<style scoped>
.order-detail-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
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

/* Order Content */
.order-content {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin: 0;
  font-weight: bold;
}

.back-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-base);
  transition: color var(--transition-base);
}

.back-link:hover {
  color: var(--color-primary);
}

/* Status Card */
.status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.status-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.status-label {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.order-status {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: bold;
  text-transform: capitalize;
}

.order-status.pending {
  background: #fff3cd;
  color: #856404;
}

.order-status.paid {
  background: #d4edda;
  color: #155724;
}

.order-status.shipped {
  background: #cce5ff;
  color: #004085;
}

.order-status.completed {
  background: #d1e7dd;
  color: #0f5132;
}

.order-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.date-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.date-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.date-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

/* Cards */
.shipping-card,
.items-card,
.summary-card {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.shipping-card h2,
.items-card h2 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.shipping-details p {
  margin: var(--spacing-xs) 0;
  color: var(--color-text-primary);
  line-height: 1.6;
}

.shipping-details strong {
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 100px;
  display: inline-block;
}

/* Items List */
.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.order-item.clickable {
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.order-item.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
}

.item-details {
  flex: 1;
}

.item-details h3 {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.item-condition {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.item-price {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.item-subtotal {
  text-align: right;
  min-width: 120px;
}

.subtotal-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-right: var(--spacing-xs);
}

.subtotal-value {
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--color-primary);
}

/* Summary Card */
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  color: var(--color-text-secondary);
}

.summary-row.total {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.total-price {
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

/* Write Review Section */
.write-review-section {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-top: var(--spacing-xl);
}

.write-review-section h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

/* Product Info Box */
.product-info-box {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.product-image-small {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.product-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.product-condition {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Multiple Products */
.multiple-products {
  margin-bottom: var(--spacing-lg);
}

.product-review-item {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.product-info-simple {
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
}

.product-review-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: bold;
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-control.small {
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.star-rating {
  display: flex;
  gap: 8px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #d1d5db;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.star-btn.active {
  color: #f59e0b;
}

.star-btn:hover {
  color: #f59e0b;
}

.btn-submit-review {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: bold;
  margin-top: var(--spacing-lg);
  transition: background-color 0.2s;
}

.btn-submit-review:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-submit-review:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.multiple-review-actions {
  margin-top: var(--spacing-lg);
}

/* Already Reviewed */
.already-reviewed {
  background: #d4edda;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-xl);
  text-align: center;
  color: #155724;
}

/* Review Success */
.review-success {
  background: #d4edda;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-xl);
  text-align: center;
  color: #155724;
}

.btn-view-reviews {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color 0.2s;
}

.btn-view-reviews:hover {
  background: var(--color-primary-dark);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.pay-btn {
  background: #27ae60;
}

.pay-btn:hover {
  background: #2ecc71;
}

.btn-secondary {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.seller-view-message {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-sm);
  background: var(--color-accent);
  border-radius: var(--border-radius-md);
  text-align: center;
  color: var(--color-primary-dark);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-primary-light);
}

/* Timeline Card */
.timeline-card {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.timeline-card h2 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  position: relative;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.timeline-item.active {
  opacity: 1;
}

.timeline-item.cancelled .timeline-icon {
  background: #e74c3c;
  color: white;
}

.timeline-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.timeline-item.active .timeline-icon {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.timeline-content {
  flex: 1;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px dashed var(--color-border);
}

.timeline-item:last-child .timeline-content {
  border-bottom: none;
}

.timeline-title {
  font-size: var(--font-size-base);
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.timeline-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: monospace;
}

.product-selector {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.selector-label {
  display: block;
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.product-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  background: white;
  cursor: pointer;
}

.product-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.review-progress {
  margin-top: var(--spacing-sm);
  text-align: right;
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Review Input Area */
.review-input-area {
  margin-top: var(--spacing-lg);
}

/* Already Reviewed Box */
.already-reviewed-box {
  margin-top: var(--spacing-lg);
}

.already-reviewed-message {
  text-align: center;
  padding: var(--spacing-lg);
  background: #d4edda;
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-md);
}

.already-reviewed-message p {
  margin-bottom: var(--spacing-md);
  color: #155724;
}

.btn-view-review {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color 0.2s;
}

.btn-view-review:hover {
  background: var(--color-primary-dark);
}

/* Reviewed Products List */
.reviewed-products-list {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 2px solid var(--color-border);
}

.reviewed-products-list h4 {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.reviewed-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.reviewed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.reviewed-item span {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  text-decoration: underline;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.btn-link:hover {
  color: var(--color-primary-dark);
}

/* All Reviewed Message */
.all-reviewed-message {
  text-align: center;
  padding: var(--spacing-xl);
  background: #d4edda;
  border-radius: var(--border-radius-lg);
  color: #155724;
}

.all-reviewed-message p {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
}

/* Review Actions */
.review-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn-cancel {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: bold;
  transition: all var(--transition-base);
}

.btn-cancel:hover {
  background: var(--color-border);
}

/* Product Info Box */
.product-info-box {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.product-image-small {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.product-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.product-condition {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Form Groups */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: bold;
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Star Rating */
.star-rating {
  display: flex;
  gap: 8px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #d1d5db;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.star-btn.active {
  color: #f59e0b;
}

.star-btn:hover {
  color: #f59e0b;
}

.btn-submit-review {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-submit-review:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-submit-review:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-id {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  font-family: monospace;
}

.product-id-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  font-family: monospace;
}

.products-review-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.product-review-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
}

.product-review-card .product-info-box {
  margin-bottom: var(--spacing-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .status-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .order-item {
    flex-direction: column;
    text-align: center;
  }
  
  .item-subtotal {
    text-align: center;
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .shipping-details p {
    display: flex;
    flex-direction: column;
  }
  
  .shipping-details strong {
    min-width: auto;
    margin-bottom: var(--spacing-xs);
  }
  
  .product-info-box {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>