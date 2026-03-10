<template>
  <div class="orders-page">
    <div class="container">
      <h1 class="page-title">{{ $t('orders.title') }}</h1>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadOrders" class="btn-primary">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- No Orders -->
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h2>{{ $t('orders.noOrders') }}</h2>
        <p>{{ $t('orders.noOrdersDesc') }}</p>
        <router-link to="/" class="btn-primary">
          {{ $t('orders.startShopping') }}
        </router-link>
      </div>

      <!-- Orders List -->
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div class="order-info">
              <span class="order-number">{{ $t('orders.orderNumber') }}: #{{ order.id }}</span>
              <span class="order-date">{{ formatDate(order.date) }}</span>
            </div>
            <span class="order-status" :class="order.status">
              {{ getStatusText(order.status) }}
            </span>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <img :src="item.image" :alt="item.name" class="item-image">
              <div class="item-details">
                <h4>{{ item.name }}</h4>
                <p class="item-condition">{{ item.condition }}</p>
                <p class="item-price">¥{{ item.price }}</p>
              </div>
              <div class="item-quantity">x{{ item.quantity }}</div>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-totals">
              <div class="totals-row">
                <span>{{ $t('orders.subtotal') }}:</span>
                <span>¥{{ calculateSubtotal(order.items) }}</span>
              </div>
              <div class="totals-row">
                <span>{{ $t('orders.shipping') }}:</span>
                <span>¥{{ calculateShipping(order.items) }}</span>
              </div>
              <div class="totals-row total">
                <span>{{ $t('orders.total') }}:</span>
                <span class="total-price">¥{{ calculateTotal(order.items) }}</span>
              </div>
            </div>
            <div class="order-actions">
              <button class="btn-secondary" @click="viewOrderDetails(order.id)">
                {{ $t('orders.viewDetails') }}
              </button>
              <button 
                v-if="order.status === 'pending'" 
                class="btn-primary pay-btn" 
                @click="payOrder(order.id)"
              >
                {{ $t('orders.payNow') }}
              </button>
            </div>
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
import { isAuthenticated } from '../services/authService'

const router = useRouter()
const { t } = useI18n()

const orders = ref([])
const isLoading = ref(true)
const error = ref(null)

// Load orders from API
const loadOrders = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to load orders')
    }
    
    orders.value = await response.json()
  } catch (err) {
    console.error('Failed to load orders:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// Calculate subtotal from items
const calculateSubtotal = (items) => {
  if (!items) return 0
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

// Calculate shipping (free over 500, otherwise 50)
const calculateShipping = (items) => {
  const subtotal = calculateSubtotal(items)
  return subtotal >= 500 ? 0 : 50
}

// Calculate total
const calculateTotal = (items) => {
  const subtotal = calculateSubtotal(items)
  const shipping = calculateShipping(items)
  return subtotal + shipping
}

// Pay order - always succeeds
const payOrder = async (orderId) => {
  if (!confirm('Proceed to payment?')) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${orderId}/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      alert('✅ Payment successful! Your order has been confirmed.')
      await loadOrders() // Reload orders to update status
    } else {
      alert('❌ ' + (data.error || 'Payment failed'))
    }
  } catch (err) {
    console.error('Payment error:', err)
    alert('❌ Payment failed. Please try again.')
  }
}

// Format date
const formatDate = (dateString) => {
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
    'pending': t('orders.status.pending'),
    'paid': t('orders.status.paid'),
    'shipped': t('orders.status.shipped'),
    'completed': t('orders.status.completed'),
    'cancelled': t('orders.status.cancelled')
  }
  return statusMap[status] || status
}

// View order details
const viewOrderDetails = (orderId) => {
  router.push(`/order/${orderId}`)
}

// Check authentication
onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xxl);
  font-weight: bold;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-xxxl) var(--spacing-lg);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h2 {
  font-size: var(--font-size-xxl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.order-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.order-number {
  font-size: var(--font-size-base);
  font-weight: bold;
  color: var(--color-text-primary);
}

.order-date {
  font-size: var(--font-size-sm);
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

/* Order Items */
.order-items {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.order-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.item-details {
  flex: 1;
}

.item-details h4 {
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

.item-quantity {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

/* Order Footer */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.order-total {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.total-price {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--color-primary);
}

.order-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
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

.btn-secondary {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.pay-btn {
  background: #27ae60;
}

.pay-btn:hover {
  background: #2ecc71;
}

.order-totals {
  flex: 1;
  padding-right: var(--spacing-lg);
}

.totals-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.totals-row.total {
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: bold;
}

.total-price {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .order-footer {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  .order-item {
    flex-direction: column;
    text-align: center;
  }
  
  .item-details {
    text-align: center;
  }
}
</style>