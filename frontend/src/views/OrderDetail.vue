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
          <!-- Change this back link based on seller view -->
          <router-link :to="isSellerView ? '/seller?tab=orders' : '/orders'" class="back-link">
            ← {{ isSellerView ? 'Back to Seller Dashboard' : $t('orderDetail.backToList') }}
          </router-link>
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
            <p><strong>{{ $t('orderDetail.paymentMethod') }}:</strong> {{ order.payment_method || t('orderDetail.notSpecified') }}</p>
            <p v-if="order.transaction_id"><strong>{{ $t('orderDetail.transactionId') }}:</strong> {{ order.transaction_id }}</p>
            <p v-if="order.paid_at"><strong>{{ $t('orderDetail.paidAt') }}:</strong> {{ formatDate(order.paid_at) }}</p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="items-card">
          <h2>{{ $t('orderDetail.orderItems') }}</h2>
          <div class="items-list">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <img :src="item.image" :alt="item.name" class="item-image">
              <div class="item-details">
                <h3>{{ item.name }}</h3>
                <p class="item-condition">{{ item.condition }}</p>
                <p class="item-price">¥{{ item.price }} x {{ item.quantity }}</p>
              </div>
              <div class="item-subtotal">
                <span class="subtotal-label">{{ $t('orderDetail.subtotal') }}:</span>
                <span class="subtotal-value">¥{{ item.price * item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="summary-card">
          <div class="summary-row">
            <span>{{ $t('orderDetail.subtotal') }}:</span>
            <span>¥{{ order.subtotal || order.total }}</span>
          </div>
          <div class="summary-row">
            <span>{{ $t('orderDetail.shipping') }}:</span>
            <span>¥{{ order.shipping_cost || 0 }}</span>
          </div>
          <div class="summary-row total">
            <span>{{ $t('orderDetail.total') }}:</span>
            <span class="total-price">¥{{ order.total }}</span>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAuthenticated } from '../services/authService'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const order = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isSellerView = ref(false)

// Load order from API
const loadOrder = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const orderId = route.params.id
    const token = localStorage.getItem('token')
    const isSeller = route.query.seller === 'true'  // Renamed to isSeller
    
    // Use different endpoints for seller vs user
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
    
    // Store whether this is seller view - use different variable name
    isSellerView.value = isSeller  // Fixed: using different names
    
  } catch (err) {
    console.error('Failed to load order:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
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
    'pending': 'Pending Payment',
    'paid': 'Paid',
    'shipped': 'Shipped',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || status
}

// Pay order - always succeeds
const payOrder = async () => {
  if (!confirm('Proceed to payment?')) return
  
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
      alert('✅ Payment successful! Your order has been confirmed.')
      await loadOrder() // Reload order
    } else {
      alert('❌ ' + (data.error || 'Payment failed'))
    }
  } catch (err) {
    console.error('Payment error:', err)
    alert('❌ Payment failed. Please try again.')
  }
}

// Cancel order
const cancelOrder = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${order.value.id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      alert('Order cancelled successfully')
      await loadOrder()
    } else {
      const data = await response.json()
      alert(data.error || 'Failed to cancel order')
    }
  } catch (err) {
    console.error('Failed to cancel order:', err)
    alert('Failed to cancel order')
  }
}

// Confirm receipt
const confirmReceipt = async () => {
  if (!confirm('Have you received your order?')) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${order.value.id}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      alert('Thank you for confirming! Order completed.')
      await loadOrder()
    } else {
      const data = await response.json()
      alert(data.error || 'Failed to confirm receipt')
    }
  } catch (err) {
    console.error('Failed to confirm receipt:', err)
    alert('Failed to confirm receipt')
  }
}

// Check authentication
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
}
</style>