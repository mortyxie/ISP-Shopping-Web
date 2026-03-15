<template>
  <div class="register-page">
    <div class="container">
      <div class="register-container">
        <div class="register-card">
          <h1 class="register-title">{{ $t('register.title') }}</h1>
          
          <form @submit.prevent="handleRegister" class="register-form">
            <!-- 用户名 -->
            <div class="form-group">
              <label for="username">{{ $t('register.username') }} *</label>
              <input
                id="username"
                type="text"
                v-model="form.username"
                :placeholder="$t('register.usernamePlaceholder')"
                class="form-input"
                required
              />
            </div>

            <!-- 邮箱 -->
            <div class="form-group">
              <label for="email">{{ $t('register.email') }} *</label>
              <input
                id="email"
                type="email"
                v-model="form.email"
                :placeholder="$t('register.emailPlaceholder')"
                class="form-input"
                required
              />
            </div>

            <!-- 密码 -->
            <div class="form-group">
              <label for="password">{{ $t('register.password') }} *</label>
              <input
                id="password"
                type="password"
                v-model="form.password"
                :placeholder="$t('register.passwordPlaceholder')"
                class="form-input"
                required
                minlength="6"
              />
            </div>

            <!-- 确认密码 -->
            <div class="form-group">
              <label for="confirmPassword">{{ $t('register.confirmPassword') }} *</label>
              <input
                id="confirmPassword"
                type="password"
                v-model="form.confirmPassword"
                :placeholder="$t('register.confirmPasswordPlaceholder')"
                class="form-input"
                required
                minlength="6"
              />
            </div>

            <!-- Shipping Address Section -->
            <div class="form-section">
              <h2 class="section-title">{{ $t('register.shippingAddress') }}</h2>
              
              <div class="form-group">
                <label for="recipientName">{{ $t('register.recipientName') }} *</label>
                <input
                  id="recipientName"
                  type="text"
                  v-model="address.recipient_name"
                  :placeholder="$t('register.recipientNamePlaceholder')"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="phone">{{ $t('register.phone') }} *</label>
                <input
                  id="phone"
                  type="tel"
                  v-model="address.phone"
                  :placeholder="$t('register.phonePlaceholder')"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="addressLine1">{{ $t('register.addressLine1') }} *</label>
                <input
                  id="addressLine1"
                  type="text"
                  v-model="address.address_line1"
                  :placeholder="$t('register.addressLine1Placeholder')"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="addressLine2">{{ $t('register.addressLine2') }}</label>
                <input
                  id="addressLine2"
                  type="text"
                  v-model="address.address_line2"
                  :placeholder="$t('register.addressLine2Placeholder')"
                  class="form-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label for="city">{{ $t('register.city') }} *</label>
                  <input
                    id="city"
                    type="text"
                    v-model="address.city"
                    :placeholder="$t('register.cityPlaceholder')"
                    class="form-input"
                    required
                  />
                </div>
                <div class="form-group half">
                  <label for="state">{{ $t('register.state') }}</label>
                  <input
                    id="state"
                    type="text"
                    v-model="address.state"
                    :placeholder="$t('register.statePlaceholder')"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label for="postalCode">{{ $t('register.postalCode') }} *</label>
                  <input
                    id="postalCode"
                    type="text"
                    v-model="address.postal_code"
                    :placeholder="$t('register.postalCodePlaceholder')"
                    class="form-input"
                    required
                  />
                </div>
                <div class="form-group half">
                  <label for="country">{{ $t('register.country') }} *</label>
                  <select id="country" v-model="address.country" class="form-input" required>
                    <option value="">{{ $t('register.selectCountry') }}</option>
                    <option value="China">China</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Japan">Japan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 错误信息 -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <!-- 成功信息 -->
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>

            <!-- 提交按钮 -->
            <button 
              type="submit" 
              class="register-button"
              :disabled="isLoading"
            >
              {{ isLoading ? $t('register.registering') : $t('register.registerButton') }}
            </button>
          </form>

          <!-- 登录链接 -->
          <div class="register-links">
            <span>{{ $t('register.haveAccount') }}</span>
            <router-link to="/login" class="link">
              {{ $t('register.loginNow') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 表单数据
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Shipping address data
const address = ref({
  recipient_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// 处理注册
const handleRegister = async () => {
  // Clear previous messages
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validate user info
  if (!form.value.username.trim()) {
    errorMessage.value = t('register.error.usernameRequired')
    return
  }
  
  if (!form.value.email.trim()) {
    errorMessage.value = t('register.error.emailRequired')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    errorMessage.value = t('register.error.emailInvalid')
    return
  }
  
  if (!form.value.password) {
    errorMessage.value = t('register.error.passwordRequired')
    return
  }
  
  if (form.value.password.length < 6) {
    errorMessage.value = t('register.error.passwordTooShort')
    return
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = t('register.error.passwordMismatch')
    return
  }

  // Validate shipping address
  if (!address.value.recipient_name) {
    errorMessage.value = t('register.error.recipientNameRequired')
    return
  }
  
  if (!address.value.phone) {
    errorMessage.value = t('register.error.phoneRequired')
    return
  }
  
  if (!address.value.address_line1) {
    errorMessage.value = t('register.error.addressRequired')
    return
  }
  
  if (!address.value.city) {
    errorMessage.value = t('register.error.cityRequired')
    return
  }
  
  if (!address.value.postal_code) {
    errorMessage.value = t('register.error.postalCodeRequired')
    return
  }
  
  if (!address.value.country) {
    errorMessage.value = t('register.error.countryRequired')
    return
  }
  
  isLoading.value = true
  
  try {
    // Register user
    const registerResponse = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password
      })
    })
    
    const registerData = await registerResponse.json()
    
    if (!registerResponse.ok) {
      errorMessage.value = registerData.message || t('register.error.registrationFailed')
      return
    }
    
    // Login to get token
    const loginResponse = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: form.value.username,
        password: form.value.password
      })
    })
    
    const loginData = await loginResponse.json()
    
    if (!loginResponse.ok || !loginData.success) {
      errorMessage.value = t('register.error.loginAfterRegister')
      setTimeout(() => router.push('/login'), 2000)
      return
    }
    
    // Save token
    localStorage.setItem('token', loginData.token)
    localStorage.setItem('currentUser', JSON.stringify(loginData.user))
    
    // Add shipping address
    const addressResponse = await fetch('/api/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        ...address.value,
        is_default: true
      })
    })
    
    const addressData = await addressResponse.json()
    
    if (addressResponse.ok) {
      successMessage.value = t('register.success')
      window.dispatchEvent(new Event('userStateChanged'))
      setTimeout(() => router.push('/'), 2000)
    } else {
      errorMessage.value = addressData.error || t('address.messages.error.createFailed')
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = t('register.error.networkError')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
  position: relative;
  overflow: hidden;
}

/* 凤凰花装饰 */
.register-page::before {
  content: '';
  position: absolute;
  top: 10%;
  right: 10%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
  opacity: 0.1;
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.register-page::after {
  content: '';
  position: absolute;
  bottom: 15%;
  left: 8%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%);
  opacity: 0.1;
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  width: 100%;
}

.register-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.register-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.register-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-weight: bold;
}

.register-form {
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color var(--transition-base);
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
  border-left: 4px solid var(--color-primary);
}

.section-title {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
}

.form-row {
  display: flex;
  gap: var(--spacing-md);
}

.form-group.half {
  flex: 1;
}

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

.register-button {
  width: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: bold;
  cursor: pointer;
  transition: background-color var(--transition-base), transform var(--transition-base);
  margin-top: var(--spacing-md);
}

.register-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-base);
  font-weight: bold;
}

.link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-md);
  }

  .register-title {
    font-size: var(--font-size-xxl);
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

@media (max-width: 767.98px) {
  .register-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-md);
  }

  .register-title {
    font-size: var(--font-size-xxl);
  }
}
</style>