<template>
  <div class="orders-page">
    <div class="container">
      <h1 class="page-title">{{ $t('orders.title') }}</h1>

      <!-- 订单列表 -->
      <div v-if="isLoading" class="loading">
        <p>加载中...</p>
      </div>
      <div v-else-if="orders.length === 0" class="empty-orders">
        <div class="empty-icon">📦</div>
        <h2>{{ $t('orders.empty') }}</h2>
        <p>{{ $t('orders.emptyDescription') }}</p>
        <router-link to="/" class="btn-primary">{{ $t('orders.goShopping') }}</router-link>
      </div>
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card" @click="goToOrderDetail(order.id)">
          <div class="order-header">
            <div class="order-info">
              <span class="order-id">{{ $t('orders.orderNumber') }}: #{{ order.id }}</span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-status" :class="`status-${order.status}`">
              {{ getStatusText(order.status) }}
            </div>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <img :src="item.image" :alt="item.name" class="item-image" />
              <div class="item-info">
                <h4 class="item-name">{{ item.name }}</h4>
                <p class="item-quantity">{{ $t('orders.quantity') }}: {{ item.quantity }}</p>
              </div>
              <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
            </div>
          </div>

          <div class="order-footer">
            <span class="order-total">{{ $t('orders.total') }}: <strong>¥{{ order.totalAmount.toFixed(2) }}</strong></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '../utils/api'
import { isAuthenticated } from '../utils/auth'

const router = useRouter()

const orders = ref([])
const isLoading = ref(true)

// 加载订单列表
const loadOrders = async () => {
  try {
    isLoading.value = true
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const data = await orderApi.getOrders()
    orders.value = data || []
  } catch (error) {
    console.error('加载订单失败:', error)
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

// 跳转到订单详情
const goToOrderDetail = (orderId) => {
  router.push(`/orders/${orderId}`)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xxl);
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: var(--spacing-xxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
}

.empty-orders {
  text-align: center;
  padding: var(--spacing-xxxl) var(--spacing-lg);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
}

.empty-orders h2 {
  font-size: var(--font-size-xxl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.empty-orders p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.order-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-accent);
  border-bottom: 1px solid var(--color-border);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.order-id {
  font-weight: bold;
  color: var(--color-text-primary);
}

.order-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.order-status {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-weight: bold;
  font-size: var(--font-size-sm);
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-paid {
  background: #dbeafe;
  color: #2563eb;
}

.status-shipped {
  background: #e0e7ff;
  color: #4f46e5;
}

.status-completed {
  background: #d1fae5;
  color: #059669;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.order-items {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: 500;
}

.item-quantity {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.item-price {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.order-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-accent);
  border-top: 1px solid var(--color-border);
  text-align: right;
}

.order-total {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.order-total strong {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
}

.btn-primary {
  display: inline-block;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  font-weight: bold;
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
</style>
