<template>
  <div class="checkout-page">
    <div class="container">
      <h1 class="page-title">{{ $t('checkout.title') }}</h1>

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

      <!-- Empty Cart -->
      <div v-else-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2>{{ $t('checkout.cartEmpty') }}</h2>
        <p>{{ $t('checkout.cartEmptyDesc') }}</p>
        <router-link to="/" class="btn-primary">
          {{ $t('checkout.continueShopping') }}
        </router-link>
      </div>

      <!-- Checkout Form -->
      <div v-else class="checkout-content">
        <div class="checkout-grid">
          <!-- Left Column - Shipping Information -->
          <div class="checkout-form">
            <!-- Shipping Address -->
            <div class="form-section">
              <h2>{{ $t('checkout.shippingAddress') }}</h2>
              
              <div class="form-group">
                <label for="fullName">{{ $t('checkout.fullName') }} *</label>
                <input
                  id="fullName"
                  type="text"
                  v-model="form.fullName"
                  :placeholder="$t('checkout.fullNamePlaceholder')"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="addressLine1">{{ $t('checkout.addressLine1') }} *</label>
                <input
                  id="addressLine1"
                  type="text"
                  v-model="form.addressLine1"
                  :placeholder="$t('checkout.addressLine1Placeholder')"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="addressLine2">{{ $t('checkout.addressLine2') }}</label>
                <input
                  id="addressLine2"
                  type="text"
                  v-model="form.addressLine2"
                  :placeholder="$t('checkout.addressLine2Placeholder')"
                  class="form-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label for="city">{{ $t('checkout.city') }} *</label>
                  <input
                    id="city"
                    type="text"
                    v-model="form.city"
                    :placeholder="$t('checkout.cityPlaceholder')"
                    class="form-input"
                    required
                  />
                </div>
                <div class="form-group half">
                  <label for="postalCode">{{ $t('checkout.postalCode') }} *</label>
                  <input
                    id="postalCode"
                    type="text"
                    v-model="form.postalCode"
                    :placeholder="$t('checkout.postalCodePlaceholder')"
                    class="form-input"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="country">{{ $t('checkout.country') }} *</label>
                <select id="country" v-model="form.country" class="form-input" required>
                  <option value="">{{ $t('checkout.selectCountry') }}</option>
                  <option value="China">China</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Japan">Japan</option>
                  <option value="Other">{{ $t('checkout.other') }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="phone">{{ $t('checkout.phone') }} *</label>
                <input
                  id="phone"
                  type="tel"
                  v-model="form.phone"
                  :placeholder="$t('checkout.phonePlaceholder')"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <!-- Payment Method - Multiple Options -->
            <div class="form-section">
              <h2>{{ $t('checkout.paymentMethod') }}</h2>
              
              <div class="payment-options">
                <label class="payment-option">
                  <input type="radio" value="支付宝" v-model="paymentMethod" />
                  <span class="payment-label">支付宝</span>
                </label>
                <label class="payment-option">
                  <input type="radio" value="微信" v-model="paymentMethod" />
                  <span class="payment-label">微信</span>
                </label>
                <label class="payment-option">
                  <input type="radio" value="Mpay" v-model="paymentMethod" />
                  <span class="payment-label">Mpay</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Right Column - Order Summary -->
          <div class="order-summary">
            <h2>{{ $t('checkout.orderSummary') }}</h2>
            
            <div class="summary-items">
              <div v-for="item in cartItems" :key="item.id" class="summary-item">
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-condition">{{ item.condition }}</span>
                </div>
                <div class="item-price">
                  <span class="item-total">¥{{ (item.price || 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="summary-totals">
              <div class="summary-row">
                <span>{{ $t('checkout.subtotal') }}</span>
                <span>¥{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="summary-row">
                <span>{{ $t('checkout.shipping') }}</span>
                <span>¥{{ shipping.toFixed(2) }}</span>
              </div>
              <div class="summary-row total">
                <span>{{ $t('checkout.total') }}</span>
                <span class="total-price">¥{{ total.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Error/Success Messages -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>

            <!-- Place Order Button -->
            <button 
              class="place-order-btn"
              @click="placeOrder"
              :disabled="isSubmitting || !isFormValid || !paymentMethod"
            >
              <span class="btn-icon">💰</span>
              {{ isSubmitting ? $t('checkout.processing') : $t('checkout.placeOrder') }}
            </button>

            <p class="terms">
              {{ $t('checkout.terms') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Add this near the top with other imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCart, clearCart } from '../services/cartService'
import { isAuthenticated } from '../services/authService'

const router = useRouter()
const { t } = useI18n()

// State
const cartItems = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const paymentMethod = ref('支付宝') // Set default payment method

// Form data - shipping info
const form = ref({
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: '',
  phone: ''
})

// Computed values
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price || 0), 0)
})

const shipping = computed(() => {
  return subtotal.value >= 500 ? 0 : 50
})

const total = computed(() => {
  return subtotal.value + shipping.value
})

// Form validation
const isFormValid = computed(() => {
  return form.value.fullName && 
         form.value.addressLine1 && 
         form.value.city && 
         form.value.postalCode && 
         form.value.country && 
         form.value.phone
})

// Load checkout items (from either draft or cart)
const loadCheckoutItems = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Check if there's a checkout draft (from Buy Now)
    const draftStr = sessionStorage.getItem('checkout_draft')
    if (draftStr) {
      const draft = JSON.parse(draftStr)
      if (draft?.items?.length) {
        console.log('Loading from draft:', draft)
        cartItems.value = draft.items.map((it) => ({
          id: it.product_id,
          name: it.name,
          artist: it.artist,
          image: it.image,
          condition: it.condition,
          price: Number(it.price_at_purchase || 0)
        }))
        // Clear the draft after loading
        sessionStorage.removeItem('checkout_draft')
        return
      }
    }

    // If no draft, load from cart
    console.log('No draft found, loading from cart')
    const cart = await getCart()
    if (!cart.length) {
      error.value = '购物车为空，无法结算'
      return
    }
    cartItems.value = cart
  } catch (e) {
    console.error('Failed to load checkout items:', e)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// Format shipping address
const getFormattedAddress = () => {
  const parts = [
    form.value.fullName,
    form.value.addressLine1,
    form.value.addressLine2,
    `${form.value.city}, ${form.value.postalCode}`,
    form.value.country,
    `Phone: ${form.value.phone}`
  ].filter(Boolean)
  
  return parts.join('\n')
}

// Place order
const placeOrder = async () => {
  if (!isFormValid.value || !paymentMethod.value) return
  
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const token = localStorage.getItem('token')
    
    // Send the cart items directly to the backend
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shipping_address: getFormattedAddress(),
        payment_method: paymentMethod.value,
        items: cartItems.value.map(item => ({
          product_id: item.id,
          price: item.price,
          quantity: 1
        }))
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // Clear the cart only if it was a cart checkout, not a draft
      const hadDraft = sessionStorage.getItem('checkout_draft')
      if (!hadDraft) {
        await clearCart()
      }
      sessionStorage.removeItem('checkout_draft')
      
      successMessage.value = t('checkout.orderSuccess')
      setTimeout(() => {
        router.push(`/order/${data.order_id}`)
      }, 2000)
    } else {
      errorMessage.value = data.error || t('checkout.orderFailed')
    }
  } catch (err) {
    console.error('Failed to place order:', err)
    errorMessage.value = t('checkout.orderFailed')
  } finally {
    isSubmitting.value = false
  }
}

// Update onMounted to use loadCheckoutItems
onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadCheckoutItems()
})
</script>

<style scoped>
/* Keep your existing styles exactly as they were */
.checkout-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 1200px;
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

/* Empty Cart */
.empty-cart {
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

.empty-cart h2 {
  font-size: var(--font-size-xxl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.empty-cart p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

/* Checkout Grid */
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-xl);
}

/* Form Sections */
.checkout-form {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.form-section h2 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-base);
  background: var(--color-bg);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-row {
  display: flex;
  gap: var(--spacing-md);
}

.form-group.half {
  flex: 1;
}

/* Payment Options */
.payment-options {
  display: flex;
  flex-direction: column;
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
  transition: all var(--transition-base);
}

.payment-option:hover {
  border-color: var(--color-primary);
  background: var(--color-accent);
}

.payment-option input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.payment-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

/* Order Summary */
.order-summary {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.order-summary h2 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
}

.summary-items {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: var(--spacing-lg);
  padding-right: var(--spacing-sm);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.item-condition {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  margin-top: 2px;
}

.item-price {
  text-align: right;
}

.item-quantity {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.item-total {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.summary-totals {
  margin-bottom: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--color-border);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
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

/* Messages */
.error-message {
  background-color: var(--color-accent);
  color: var(--color-primary-dark);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  text-align: center;
  border: 1px solid var(--color-primary-light);
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  text-align: center;
  border: 1px solid #c3e6cb;
}

/* Place Order Button */
.place-order-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.place-order-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.place-order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: var(--font-size-xl);
}

.terms {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 992px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  
  .order-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .page-title {
    font-size: var(--font-size-xxl);
  }
}
</style>