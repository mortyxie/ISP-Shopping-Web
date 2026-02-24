<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">{{ $t('cart.title') }}</h1>

      <!-- 购物车为空 -->
      <div v-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2>{{ $t('cart.empty') }}</h2>
        <p>{{ $t('cart.emptyDescription') }}</p>
        <router-link to="/" class="btn-primary">
          {{ $t('cart.goShopping') }}
        </router-link>
      </div>

      <!-- 购物车有商品 -->
      <div v-else class="cart-content">
        <div class="cart-items">
          <div class="cart-header">
            <div class="header-col product-col">{{ $t('cart.product') }}</div>
            <div class="header-col price-col">{{ $t('cart.price') }}</div>
            <div class="header-col quantity-col">{{ $t('cart.quantity') }}</div>
            <div class="header-col subtotal-col">{{ $t('cart.subtotal') }}</div>
            <div class="header-col action-col">{{ $t('cart.action') }}</div>
          </div>

          <div
            v-for="item in cartItems"
            :key="item.id"
            class="cart-item"
          >
            <div class="item-col product-col">
              <div class="product-info">
                <img :src="item.image" :alt="item.name" class="product-image" />
                <div class="product-details">
                  <h3 class="product-name">{{ item.name }}</h3>
                </div>
              </div>
            </div>

            <div class="item-col price-col">
              <span class="price">¥{{ item.price.toFixed(2) }}</span>
            </div>

            <div class="item-col quantity-col">
              <div class="quantity-control">
                <button
                  class="quantity-btn"
                  @click="updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                >
                  −
                </button>
                <input
                  type="number"
                  :value="item.quantity"
                  @change="handleQuantityChange(item.id, $event)"
                  min="1"
                  class="quantity-input"
                />
                <button
                  class="quantity-btn"
                  @click="updateQuantity(item.id, item.quantity + 1)"
                >
                  +
                </button>
              </div>
            </div>

            <div class="item-col subtotal-col">
              <span class="subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>

            <div class="item-col action-col">
              <button
                class="remove-btn"
                @click="removeItem(item.id)"
                :title="$t('cart.remove')"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- 购物车汇总 -->
        <div class="cart-summary">
          <div class="summary-card">
            <h3 class="summary-title">{{ $t('cart.total') }}</h3>
            <div class="summary-row">
              <span class="summary-label">{{ $t('cart.total') }}：</span>
              <span class="summary-value">¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="summary-actions">
              <router-link to="/" class="btn-secondary">
                {{ $t('cart.continueShopping') }}
              </router-link>
              <button
                class="btn-primary checkout-btn"
                @click="handleCheckout"
              >
                {{ $t('cart.checkout') }}
              </button>
            </div>
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
import { getCart, updateCartItemQuantity, removeFromCart, getCartTotal } from '../utils/cart'
import { isAuthenticated } from '../utils/auth'

const router = useRouter()
const { t } = useI18n()

const cartItems = ref([])

// 计算总价
const totalPrice = computed(() => {
  return getCartTotal()
})

// 加载购物车数据
const loadCart = () => {
  cartItems.value = getCart()
}

// 更新商品数量
const updateQuantity = (productId, quantity) => {
  if (quantity < 1) return
  updateCartItemQuantity(productId, quantity)
  loadCart()
}

// 处理数量输入框变化
const handleQuantityChange = (productId, event) => {
  const quantity = parseInt(event.target.value) || 1
  if (quantity < 1) {
    event.target.value = 1
    return
  }
  updateCartItemQuantity(productId, quantity)
  loadCart()
}

// 删除商品
const removeItem = (productId) => {
  if (confirm('确定要删除这个商品吗？')) {
    removeFromCart(productId)
    loadCart()
    // 触发Header更新
    window.dispatchEvent(new Event('cartUpdated'))
  }
}

// 去结算
const handleCheckout = () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  router.push('/checkout')
}

// 监听购物车更新事件
const handleCartUpdate = () => {
  loadCart()
}

onMounted(() => {
  loadCart()
  window.addEventListener('cartUpdated', handleCartUpdate)
})

// 清理事件监听
onUnmounted(() => {
  window.removeEventListener('cartUpdated', handleCartUpdate)
})
</script>

<style scoped>
.cart-page {
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

/* 空购物车 */
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

/* 购物车内容 */
.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-xl);
}

.cart-items {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.cart-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 0.8fr;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  font-weight: bold;
  font-size: var(--font-size-base);
}

.cart-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 0.8fr;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  transition: background-color var(--transition-base);
}

.cart-item:hover {
  background-color: var(--color-bg-light);
}

.cart-item:last-child {
  border-bottom: none;
}

.product-col {
  display: flex;
  align-items: center;
}

.product-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--color-border);
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 500;
}

.price-col,
.subtotal-col {
  text-align: center;
}

.price,
.subtotal {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.quantity-col {
  display: flex;
  justify-content: center;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.quantity-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 60px;
  height: 32px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  outline: none;
}

.quantity-input:focus {
  border-color: var(--color-primary);
}

.action-col {
  display: flex;
  justify-content: center;
}

.remove-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: transform var(--transition-base);
}

.remove-btn:hover {
  transform: scale(1.2);
}

/* 购物车汇总 */
.cart-summary {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.summary-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
  border: 2px solid var(--color-primary);
}

.summary-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-lg);
}

.summary-label {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: 500;
}

.summary-value {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  font-weight: bold;
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
  display: block;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.checkout-btn {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
  }
}

@media (max-width: 767.98px) {
  .cart-header,
  .cart-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .header-col {
    display: none;
  }

  .item-col {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-col::before {
    content: attr(data-label);
    font-weight: bold;
    color: var(--color-text-secondary);
  }

  .product-col {
    flex-direction: column;
    align-items: flex-start;
  }

  .quantity-col,
  .action-col {
    justify-content: flex-end;
  }
}
</style>
