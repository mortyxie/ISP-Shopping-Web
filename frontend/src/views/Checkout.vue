<template>
  <div class="checkout-page">
    <div class="container">
      <h1 class="page-title">{{ $t('checkout.title') }}</h1>

      <!-- 购物车为空 -->
      <div v-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2>{{ $t('cart.empty') }}</h2>
        <p>{{ $t('cart.emptyDescription') }}</p>
        <router-link to="/" class="btn-primary">{{ $t('cart.goShopping') }}</router-link>
      </div>

      <!-- 结算表单 -->
      <div v-else class="checkout-content">
        <div class="checkout-grid">
          <!-- 左侧：配送信息 -->
          <div class="shipping-info">
            <h2 class="section-title">{{ $t('checkout.shippingInfo') }}</h2>
            <form @submit.prevent="handleSubmit" class="checkout-form">
              <div class="form-group">
                <label for="name">{{ $t('checkout.name') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  id="name"
                  required
                  :placeholder="$t('checkout.namePlaceholder')"
                />
              </div>
              <div class="form-group">
                <label for="phone">{{ $t('checkout.phone') }}</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  id="phone"
                  required
                  :placeholder="$t('checkout.phonePlaceholder')"
                />
              </div>
              <div class="form-group">
                <label for="address">{{ $t('checkout.address') }}</label>
                <textarea
                  v-model="form.address"
                  id="address"
                  rows="3"
                  required
                  :placeholder="$t('checkout.addressPlaceholder')"
                ></textarea>
              </div>
            </form>
          </div>

          <!-- 右侧：订单摘要 -->
          <div class="order-summary">
            <h2 class="section-title">{{ $t('checkout.orderSummary') }}</h2>
            <div class="summary-items">
              <div v-for="item in cartItems" :key="item.id" class="summary-item">
                <div class="item-info">
                  <img :src="item.image" :alt="item.name" class="item-image" />
                  <div class="item-details">
                    <h4 class="item-name">{{ item.name }}</h4>
                    <span class="item-quantity">x{{ item.quantity }}</span>
                  </div>
                </div>
                <div class="item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
            </div>

            <div class="summary-totals">
              <div class="total-row">
                <span>{{ $t('cart.total') }}</span>
                <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
              </div>
            </div>

            <button class="btn-submit" @click="handleSubmit" :disabled="isSubmitting">
              {{ isSubmitting ? '提交中...' : $t('checkout.placeOrder') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCart, getCartTotal, clearCart } from '../utils/cart'
import { orderApi } from '../utils/api'
import { isAuthenticated, getCurrentUser } from '../utils/auth'

const router = useRouter()
const { t } = useI18n()

const cartItems = ref([])
const isSubmitting = ref(false)

const form = ref({
  name: '',
  phone: '',
  address: ''
})

// 计算总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

// 加载购物车数据
const loadCart = async () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  cartItems.value = await getCart()

  // 自动填充用户信息
  const user = getCurrentUser()
  if (user) {
    form.value.name = user.name || ''
    form.value.phone = user.phone || ''
  }
}

// 提交订单
const handleSubmit = async () => {
  if (isSubmitting.value) return

  // 验证表单
  if (!form.value.name || !form.value.phone || !form.value.address) {
    alert('请填写完整的配送信息')
    return
  }

  try {
    isSubmitting.value = true

    // 调用API创建订单
    const orderData = {
      shippingAddress: form.value.address,
      shippingPhone: form.value.phone,
      shippingName: form.value.name
    }

    const response = await orderApi.createOrder(orderData)

    if (response) {
      // 清空购物车
      await clearCart()
      window.dispatchEvent(new Event('cartUpdated'))

      // 跳转到订单详情或成功页面
      alert('订单提交成功！')
      router.push('/orders')
    }
  } catch (error) {
    console.error('提交订单失败:', error)
    alert('订单提交失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 监听购物车更新事件
const handleCartUpdate = () => {
  loadCart()
}

onMounted(() => {
  loadCart()
  window.addEventListener('cartUpdated', handleCartUpdate)
})

onUnmounted(() => {
  window.removeEventListener('cartUpdated', handleCartUpdate)
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

.empty-cart {
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

.empty-cart h2 {
  font-size: var(--font-size-xxl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.empty-cart p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.checkout-content {
  max-width: 1200px;
  margin: 0 auto;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-xl);
}

.shipping-info,
.order-summary {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.section-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-accent);
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group label {
  font-weight: bold;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.form-group input,
.form-group textarea {
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-family: inherit;
  outline: none;
  transition: all var(--transition-base);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  max-height: 400px;
  overflow-y: auto;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.item-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.item-name {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 500;
}

.item-quantity {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.item-price {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.summary-totals {
  padding-top: var(--spacing-lg);
  border-top: 2px solid var(--color-border);
  margin-bottom: var(--spacing-xl);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: bold;
}

.total-price {
  color: var(--color-primary);
  font-size: var(--font-size-xxl);
}

.btn-submit {
  width: 100%;
  padding: var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-submit:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

@media (max-width: 992px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }

  .order-summary {
    position: sticky;
    top: 20px;
  }
}
</style>
