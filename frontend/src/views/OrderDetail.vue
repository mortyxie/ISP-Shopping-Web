<template>
  <div class="order-detail-page">
    <div class="container">
      <h1 class="page-title">订单详情</h1>

      <div v-if="!detail" class="empty-state">
        <div class="empty-icon">🧾</div>
        <h2>订单不存在或无权限访问</h2>
        <button class="btn-primary" @click="router.push('/orders')">返回订单列表</button>
      </div>

      <div v-else class="content">
        <div class="panel">
          <div class="top-row">
            <div class="order-id">订单号：{{ detail.order.order_id }}</div>
            <div class="status">{{ statusText(detail.order.status) }}</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <div class="label">下单时间</div>
              <div class="value">{{ formatTime(detail.order.created_at) }}</div>
            </div>
            <div class="meta-item">
              <div class="label">支付时间</div>
              <div class="value">{{ detail.order.paid_at ? formatTime(detail.order.paid_at) : '-' }}</div>
            </div>
            <div class="meta-item">
              <div class="label">支付方式</div>
              <div class="value">{{ detail.order.payment_method }}</div>
            </div>
            <div class="meta-item">
              <div class="label">交易号</div>
              <div class="value">{{ detail.order.transaction_id }}</div>
            </div>
            <div class="meta-item meta-address">
              <div class="label">收件地址</div>
              <div class="value">{{ detail.order.shipping_address }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <h2 class="panel-title">商品明细</h2>

          <div class="items-header">
            <div class="col product-col">商品</div>
            <div class="col price-col">成交价</div>
            <div class="col qty-col">数量</div>
            <div class="col subtotal-col">小计</div>
          </div>

          <div
            v-for="it in detail.items"
            :key="it.order_item_id"
            class="item-row clickable"
            @click="goProduct(it.product_id)"
          >
            <div class="col product-col">
              <div class="product-info">
                <img :src="it.image || placeholder" class="product-image" :alt="it.name" />
                <div class="product-meta">
                  <div class="product-name">{{ it.name || `商品 ${it.product_id}` }}</div>
                  <div class="product-sub">{{ it.artist }} · {{ it.condition }}</div>
                  <div class="product-sub">product_id：{{ it.product_id }}</div>
                </div>
              </div>
            </div>
            <div class="col price-col">¥{{ Number(it.price_at_purchase).toFixed(2) }}</div>
            <div class="col qty-col">{{ it.quantity || 1 }}</div>
            <div class="col subtotal-col">
              ¥{{ (Number(it.price_at_purchase) * Number(it.quantity || 1)).toFixed(2) }}
            </div>
          </div>

          <div class="total-row">
            合计：<span class="money">¥{{ Number(detail.order.total_amount).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetailForCurrentUser } from '../services/orderService'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => route.params.id)
const detail = computed(() => getOrderDetailForCurrentUser(orderId.value))

const placeholder =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTJlMmUyIi8+PHRleHQgeD0iMTYiIHk9IjQ1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='

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

const goProduct = (productId) => {
  if (!productId) return
  router.push(`/product/${productId}`)
}
</script>

<style scoped>
.order-detail-page {
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

.content {
  display: grid;
  gap: var(--spacing-xl);
}

.panel {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
}

.panel-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.order-id {
  font-weight: 800;
  color: var(--color-text-primary);
}

.status {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-primary);
  font-weight: 800;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.meta-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-light);
}

.meta-address {
  grid-column: 1 / -1;
}

.label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: 4px;
}

.value {
  color: var(--color-text-primary);
  font-weight: 600;
  word-break: break-word;
}

.items-header,
.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--spacing-md);
  align-items: center;
}

.items-header {
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.item-row {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.item-row.clickable {
  cursor: pointer;
  transition: background-color var(--transition-base), transform var(--transition-base);
}

.item-row.clickable:hover {
  background: var(--color-bg-light);
  transform: translateX(2px);
}

.product-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.product-image {
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius-md);
  object-fit: cover;
  border: 2px solid var(--color-border);
}

.product-name {
  font-weight: 700;
  color: var(--color-text-primary);
}

.product-sub {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.total-row {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-lg);
}

.money {
  color: var(--color-primary);
  font-weight: 900;
  margin-left: 6px;
}

.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: bold;
  transition: background-color var(--transition-base);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

@media (max-width: 767.98px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
