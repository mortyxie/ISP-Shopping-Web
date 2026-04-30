<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">{{ $t('cart.title') }}</h1>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadCart" class="btn-primary">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- 购物车为空 -->
      <div v-else-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2>{{ $t('cart.empty') }}</h2>
        <p>{{ $t('cart.emptyDescription') }}</p>
        <router-link to="/" class="btn-primary">
          {{ $t('cart.goShopping') }}
        </router-link>
      </div>

      <!-- 购物车有商品 -->
      <div v-else class="cart-content">
        <div class="care-only care-banner">
          <div class="title">🛒 {{ $t('careMode.cartTitle') }}</div>
          <div class="desc" v-html="$t('careMode.cartDescription')"></div>
        </div>
        <div class="cart-items">
          <div class="cart-header">
            <div class="header-col select-col care-hide">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="select-all-checkbox"
                :disabled="cartItems.length === 0"
              />
            </div>
            <div class="header-col product-col">{{ $t('cart.product') }}</div>
            <div class="header-col price-col">{{ $t('cart.price') }}</div>
            <div class="header-col qty-col">{{ $t('cart.quantity') }}</div>
            <div class="header-col action-col">{{ $t('cart.action') }}</div>
          </div>

          <div
            v-for="item in cartItems"
            :key="item.id"
            class="cart-item"
            :class="{ 'item-selected': selectedItems.has(item.id) }"
          >
            <div class="item-col select-col care-hide">
              <input
                type="checkbox"
                :checked="selectedItems.has(item.id)"
                @change="toggleSelect(item.id)"
                class="item-checkbox"
                :disabled="isSoldOut(item)"
              />
            </div>

            <div class="item-col product-col">
              <div class="product-info clickable" @click="goProduct(item.id)">
                <img
                  :src="item.image || getRecordPlaceholder(item.id)"
                  :alt="item.name"
                  class="product-image"
                  @error="(e) => (e.target.src = getRecordPlaceholder(item.id))"
                />
                <div class="product-details">
                  <h3 class="product-name">{{ item.name }}</h3>
                  <p class="product-condition">{{ formatCondition(item.condition) }}</p>
                  <p v-if="isSoldOut(item)" class="sold-out">已售罄</p>
                </div>
              </div>
            </div>

            <div class="item-col price-col">
              <span class="price">¥{{ item.price.toFixed(2) }}</span>
            </div>

            <div class="item-col qty-col">
              <select
                class="qty-select"
                :value="typeof item.quantity === 'number' ? item.quantity : (selectedItems.has(item.id) ? 1 : 0)"
                @change="(e) => setQty(item, e.target.value)"
                :disabled="isSoldOut(item)"
                :title="$t('cart.quantity')"
              >
                <option :value="0">0</option>
                <option :value="1">1</option>
              </select>
            </div>

            <div class="item-col action-col">
              <button
                class="buy-now-btn"
                @click="buyNow(item.id, item.name, item.price, item.condition, item.image, item.artist)"
                :title="$t('cart.buyNow')"
                :disabled="isLoading || isSoldOut(item)"
              >
                🛒 {{ $t('cart.buyNow') }}
              </button>
              <button
                class="remove-btn"
                @click="removeItem(item.id)"
                :title="$t('cart.remove')"
                :disabled="isLoading"
              >
                🗑️ {{ $t('cart.remove') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 购物车汇总 -->
        <div class="cart-summary">
          <div class="summary-card">
            <h3 class="summary-title">{{ $t('cart.total') }}</h3>
            <div class="summary-row">
              <span class="summary-label">{{ $t('cart.selectedCount') }}：{{ selectedItems.size }}</span>
              <span class="summary-label">{{ $t('cart.total') }}：</span>
              <span class="summary-value">¥{{ selectedPrice.toFixed(2) }}</span>
            </div>
            <div class="summary-actions">
              <router-link to="/" class="btn-secondary">
                {{ $t('cart.continueShopping') }}
              </router-link>
              <button
                class="btn-primary buy-selected-btn"
                @click="buySelected"
                :disabled="isLoading || selectedItems.size === 0"
              >
                {{ $t('cart.buySelected') }} ({{ selectedItems.size }})
              </button>
              <button
                class="btn-primary checkout-btn"
                @click="handleCheckout"
                :disabled="isLoading"
              >
                {{ $t('cart.buyAll') }}
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
import { getRecordPlaceholder } from '../utils/recordPlaceholder'
import { formatConditionLabel } from '../utils/conditionLabel'
import { getCart, removeFromCart, updateCartQuantity } from '../services/cartService'
import { isAuthenticated } from '../services/authService'
import { setCheckoutDraft } from '../services/orderService'

const router = useRouter()
const { t } = useI18n()

const formatCondition = (c) => formatConditionLabel(t, c)

const cartItems = ref([])
const isLoading = ref(false)
const error = ref(null)
const selectedItems = ref(new Set()) // 选中的商品ID集合

const isSoldOut = (item) => item?.is_active === 0

// 计算总价（仅计算选中的商品）
const selectedPrice = computed(() => {
  const selected = cartItems.value.filter(
    (item) => selectedItems.value.has(item.id) && item.quantity === 1 && !isSoldOut(item)
  )
  return selected.reduce((sum, item) => sum + item.price, 0)
})

// 计算全选状态
const allSelected = computed(() => {
  const selectable = cartItems.value.filter((it) => !isSoldOut(it))
  if (selectable.length === 0) return false
  return selectedItems.value.size === selectable.length
})

// 切换商品选中状态
const toggleSelect = (itemId) => {
  const item = cartItems.value.find((it) => it.id === itemId)
  if (item && isSoldOut(item)) return
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
}

// 全选/全不选
const toggleSelectAll = () => {
  if (allSelected.value) {
    // 全不选：清空所有选中项
    selectedItems.value.clear()
  } else {
    // 全选：添加所有商品ID
    cartItems.value.forEach((item) => {
      if (!isSoldOut(item)) selectedItems.value.add(item.id)
    })
  }
}

const setQty = (item, value) => {
  const v = parseInt(value, 10)
  if (Number.isNaN(v)) return
  if (item && isSoldOut(item)) return

  // Persist to backend (0 removes; 1 keeps)
  isLoading.value = true
  updateCartQuantity(item.id, v)
    .then((res) => {
      if (!res?.success) {
        alert(res?.error || 'Failed to update quantity')
        return
      }
      // reflect local state
      item.quantity = v
      if (v === 0) {
        selectedItems.value.delete(item.id)
      } else {
        selectedItems.value.add(item.id)
      }
    })
    .finally(() => {
      isLoading.value = false
    })
}

const goProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 单个商品立即购买
const buyNow = (itemId, itemName, price, condition, image, artist) => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  
  // Create draft with complete item information
  const draft = {
    source: 'cart',
    items: [{
      product_id: itemId,
      price_at_purchase: price,
      quantity: 1,
      name: itemName,
      artist: artist || '',
      image: image || getRecordPlaceholder(itemId),
      condition: condition
    }]
  }
  
  setCheckoutDraft(draft)
  router.push('/checkout')
}

// 购买选中商品
// Buy selected items
const buySelected = () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }

  const selectedCartItems = cartItems.value.filter(
    (item) => selectedItems.value.has(item.id) && item.quantity === 1 && !isSoldOut(item)
  )

  if (selectedCartItems.length === 0) {
    alert('Please select an item.')
    return
  }

  // Create draft with complete item information
  const draft = {
    source: 'cart',
    items: selectedCartItems.map(item => ({
      product_id: item.id,
      price_at_purchase: item.price,
      quantity: 1,
      name: item.name,
      artist: item.artist || '',
      image: item.image || getRecordPlaceholder(item.id),
      condition: item.condition
    }))
  }
  
  setCheckoutDraft(draft)
  router.push('/checkout')
}

// 加载购物车数据
// Load cart items
const loadCart = async () => {
  isLoading.value = true
  error.value = null
  selectedItems.value.clear()

  try {
    cartItems.value = await getCart()

    // Sync selection with quantity (0~1); sold-out items can never be selected
    cartItems.value.forEach((it) => {
      const q = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity ?? 1)
      it.quantity = q
      if (!isSoldOut(it) && q === 1) selectedItems.value.add(it.id)
    })

    console.log('Cart loaded:', cartItems.value)
  } catch (err) {
    console.error('Failed to load cart:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// 删除商品
const removeItem = async (productId) => {
  if (!confirm(t('cart.confirmRemove'))) return
  
  isLoading.value = true
  try {
    await removeFromCart(productId)
    await loadCart()
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (err) {
    console.error('Failed to remove item:', err)
    error.value = 'Failed to remove item'
  } finally {
    isLoading.value = false
  }
}

// 去结算
const handleCheckout = () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  // "Buy all" respects unique-item quantity (0~1): set all active items to 1 then checkout.
  selectedItems.value.clear()
  cartItems.value.forEach((it) => {
    if (!isSoldOut(it)) selectedItems.value.add(it.id)
  })
  buySelected()
}

// 监听购物车更新事件
const handleCartUpdate = () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadCart()
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadCart()
  window.addEventListener('cartUpdated', handleCartUpdate)
})

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
  grid-template-columns: auto 2fr 1fr 0.8fr 1.5fr;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  font-weight: bold;
  font-size: var(--font-size-base);
}

.cart-item {
  display: grid;
  grid-template-columns: auto 2fr 1fr 0.8fr 1.5fr;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  transition: background-color var(--transition-base);
}

.cart-item.item-selected {
  background-color: var(--color-bg-light);
  border-left: 4px solid var(--color-primary);
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

.select-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-all-checkbox,
.item-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.select-all-checkbox:disabled,
.item-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.product-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.product-info.clickable {
  cursor: pointer;
}

.sold-out {
  margin: var(--spacing-xs) 0 0 0;
  color: var(--color-error);
  font-weight: 800;
  font-size: var(--font-size-xs);
}

.qty-select {
  width: 64px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-bg);
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
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: 500;
}

.product-condition {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  margin: 0;
}

.price-col {
  text-align: center;
}

.price {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.action-col {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.buy-now-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.buy-now-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

.buy-now-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: 1px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.remove-btn:hover:not(:disabled) {
  background-color: var(--color-error);
  color: white;
  transform: scale(1.05);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.checkout-btn {
  width: 100%;
}

.buy-selected-btn {
  width: 100%;
  background-color: var(--color-accent);
  border: 2px solid var(--color-primary);
}

.buy-selected-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

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
    grid-template-columns: auto 1fr;
    gap: var(--spacing-sm);
  }

  .header-col.price-col,
  .header-col.action-col {
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

  .action-col {
    justify-content: flex-end;
  }
}
</style>