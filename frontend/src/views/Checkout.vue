<template>
  <div class="checkout-page">
    <div class="container">
      <h1 class="page-title">确认订单</h1>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="btn-primary" @click="router.push('/cart')">返回购物车</button>
      </div>

      <div v-else class="checkout-content">
        <!-- 左侧：商品确认 -->
        <div class="panel items-panel">
          <h2 class="panel-title">商品信息</h2>

          <div class="items-header">
            <div class="col product-col">商品</div>
            <div class="col price-col">单价</div>
            <div class="col qty-col">数量</div>
            <div class="col subtotal-col">小计</div>
          </div>

          <div v-for="it in items" :key="it.product_id" class="item-row">
            <div class="col product-col">
              <div class="product-info">
                <img :src="it.image || placeholder" class="product-image" :alt="it.name" />
                <div class="product-meta">
                  <div class="product-name">{{ it.name }}</div>
                  <div class="product-sub">{{ it.artist }} · {{ it.condition }}</div>
                </div>
              </div>
            </div>

            <div class="col price-col">¥{{ Number(it.price_at_purchase).toFixed(2) }}</div>

            <div class="col qty-col">
              <span class="qty-fixed">1</span>
            </div>

            <div class="col subtotal-col">
              ¥{{ Number(it.price_at_purchase).toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- 右侧：地址/支付/汇总 -->
        <div class="right-panel">
          <div class="panel">
            <h2 class="panel-title">收件信息</h2>
            <textarea
              class="address-input"
              v-model="shippingAddress"
              placeholder="请输入收件地址（姓名、电话、详细地址）"
              rows="4"
            />
          </div>

          <div class="panel">
            <h2 class="panel-title">支付方式</h2>
            <div class="payment-options">
              <label class="payment-option">
                <input type="radio" value="支付宝" v-model="paymentMethod" />
                支付宝
              </label>
              <label class="payment-option">
                <input type="radio" value="微信" v-model="paymentMethod" />
                微信
              </label>
              <label class="payment-option">
                <input type="radio" value="PayPal" v-model="paymentMethod" />
                PayPal
              </label>
            </div>
          </div>

          <div class="panel summary-panel">
            <h2 class="panel-title">订单汇总</h2>
            <div class="summary-row">
              <span>商品数量</span>
              <span>{{ totalQuantity }}</span>
            </div>
            <div class="summary-row">
              <span>合计</span>
              <span class="total">¥{{ totalAmount.toFixed(2) }}</span>
            </div>

            <button class="btn-primary pay-btn" :disabled="submitting" @click="submitOrder">
              {{ submitting ? '提交中...' : '确认支付（模拟成功）' }}
            </button>
            <button class="btn-secondary" :disabled="submitting" @click="router.push('/cart')">
              返回购物车
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCart, clearCart } from '../services/cartService'
import { isAuthenticated } from '../services/authService'
import {
  clearCheckoutDraft,
  createOrderFromDraft,
  getCheckoutDraft,
  setCheckoutDraft
} from '../services/orderService'

const router = useRouter()

const isLoading = ref(true)
const error = ref(null)
const submitting = ref(false)

const items = ref([])
const shippingAddress = ref('')
const paymentMethod = ref('')

const placeholder =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTJlMmUyIi8+PHRleHQgeD0iMTYiIHk9IjQ1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='

const totalQuantity = computed(() => {
  return items.value.length
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, it) => sum + Number(it.price_at_purchase || 0), 0)
})

const loadDraftOrCart = async () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const draft = getCheckoutDraft()
    if (draft?.items?.length) {
      items.value = draft.items.map((it) => ({
        product_id: it.product_id,
        price_at_purchase: Number(it.price_at_purchase ?? it.price ?? 0),
        quantity: 1,
        name: it.name,
        artist: it.artist,
        image: it.image,
        condition: it.condition
      }))
      return
    }

    const cart = await getCart()
    if (!cart.length) {
      error.value = '购物车为空，无法结算'
      return
    }

    const built = {
      source: 'cart',
      items: cart.map((it) => ({
        product_id: it.id,
        price_at_purchase: it.price,
        quantity: 1,
        name: it.name,
        artist: it.artist,
        image: it.image,
        condition: it.condition
      }))
    }
    setCheckoutDraft(built)
    items.value = built.items
  } catch (e) {
    console.error(e)
    error.value = '加载结算信息失败'
  } finally {
    isLoading.value = false
  }
}

const submitOrder = async () => {
  if (submitting.value) return
  submitting.value = true

  try {
    const result = createOrderFromDraft({
      items: items.value.map((it) => ({
        product_id: it.product_id,
        price_at_purchase: it.price_at_purchase,
        quantity: 1,
        name: it.name,
        artist: it.artist,
        image: it.image,
        condition: it.condition
      })),
      shipping_address: shippingAddress.value,
      payment_method: paymentMethod.value
    })

    if (!result.success) {
      alert(result.message || '下单失败')
      return
    }

    // 清理草稿
    clearCheckoutDraft()

    // 尝试清空购物车（如果后端已接入）
    try {
      await clearCart()
    } catch {
      // ignore
    }

    alert('支付成功（模拟）')
    router.push(`/order/${result.order.order_id}`)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDraftOrCart()
})
</script>

<style scoped>
.checkout-page {
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
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  min-height: 300px;
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

.checkout-content {
  display: grid;
  grid-template-columns: 1fr 360px;
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
  font-weight: 600;
  color: var(--color-text-primary);
}

.product-sub {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.qty-input {
  width: 90px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  outline: none;
}

.qty-input:focus {
  border-color: rgba(220, 38, 38, 0.4);
}

.qty-fixed {
  display: inline-flex;
  min-width: 90px;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-light);
  font-weight: 700;
  color: var(--color-text-primary);
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.address-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  outline: none;
  resize: vertical;
  font-size: var(--font-size-base);
}

.address-input:focus {
  border-color: rgba(220, 38, 38, 0.4);
}

.payment-options {
  display: grid;
  gap: var(--spacing-sm);
}

.payment-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color var(--transition-base), border-color var(--transition-base);
}

.payment-option:hover {
  background: var(--color-bg-light);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--color-border);
}

.summary-row:first-of-type {
  border-top: none;
}

.total {
  color: var(--color-primary);
  font-weight: bold;
  font-size: var(--font-size-xl);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
  width: 100%;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  margin-top: var(--spacing-md);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-border);
}

.pay-btn {
  margin-top: var(--spacing-md);
}

@media (max-width: 992px) {
  .checkout-content {
    grid-template-columns: 1fr;
  }
}
</style>
