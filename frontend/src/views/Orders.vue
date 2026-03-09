<template>
  <div class="orders-page">
    <div class="container">
      <h1 class="page-title">我的订单</h1>

      <div v-if="!isLoggedIn" class="empty-state">
        <div class="empty-icon">👤</div>
        <h2>请先登录</h2>
        <button class="btn-primary" @click="router.push('/login')">去登录</button>
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">🧾</div>
        <h2>暂无订单</h2>
        <p>你还没有下单记录，先去逛逛吧。</p>
        <button class="btn-primary" @click="router.push('/')">去首页</button>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="o in orders"
          :key="o.order_id"
          class="order-card"
          @click="router.push(`/order/${o.order_id}`)"
        >
          <div class="order-top">
            <div class="order-id">订单号：{{ o.order_id }}</div>
            <div class="order-status">{{ statusText(o.status) }}</div>
          </div>

          <div class="order-mid">
            <div class="order-row">
              <span class="label">下单时间</span>
              <span class="value">{{ formatTime(o.created_at) }}</span>
            </div>
            <div class="order-row">
              <span class="label">支付方式</span>
              <span class="value">{{ o.payment_method }}</span>
            </div>
            <div class="order-row">
              <span class="label">收件地址</span>
              <span class="value address">{{ o.shipping_address }}</span>
            </div>
          </div>

          <div class="order-bottom">
            <div class="amount">
              合计：<span class="money">¥{{ Number(o.total_amount).toFixed(2) }}</span>
            </div>
            <button class="btn-secondary" @click.stop="router.push(`/order/${o.order_id}`)">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, isAuthenticated } from '../services/authService'
import { getOrdersForCurrentUser } from '../services/orderService'

const router = useRouter()

const orders = ref([])
const isLoggedIn = computed(() => isAuthenticated() && !!getCurrentUser())

const reload = () => {
  orders.value = getOrdersForCurrentUser()
}

const formatTime = (iso) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const statusText = (status) => {
  const map = {
    pending: '待处理',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status || '未知状态'
}

onMounted(() => {
  reload()
  window.addEventListener('userStateChanged', reload)
})

onUnmounted(() => {
  window.removeEventListener('userStateChanged', reload)
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

.empty-state {
  text-align: center;
  padding: var(--spacing-xxxl) var(--spacing-lg);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.orders-list {
  display: grid;
  gap: var(--spacing-lg);
}

.order-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform var(--transition-base), border-color var(--transition-base);
}

.order-card:hover {
  transform: translateY(-2px);
  border-color: rgba(220, 38, 38, 0.25);
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.order-id {
  font-weight: 700;
  color: var(--color-text-primary);
}

.order-status {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-primary);
  font-weight: 700;
}

.order-mid {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.order-row {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.label {
  color: var(--color-text-secondary);
  flex: 0 0 auto;
}

.value {
  color: var(--color-text-primary);
  text-align: right;
}

.value.address {
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.money {
  color: var(--color-primary);
  font-weight: 800;
  font-size: var(--font-size-xl);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}
</style>
