<template>
  <div class="register-page">
    <div class="container">
      <div class="register-container">
        <div class="register-card">
          <h1 class="register-title">{{ $t('register.title') }}</h1>
          
          <form @submit.prevent="handleRegister" class="register-form">
            <!-- 用户名 -->
            <div class="form-group">
              <label for="username">{{ $t('register.username') }}</label>
              <input
                id="username"
                type="text"
                v-model="form.username"
                :placeholder="$t('register.usernamePlaceholder')"
                class="form-input"
                autocomplete="username"
                required
              />
            </div>

            <!-- 邮箱 -->
            <div class="form-group">
              <label for="email">{{ $t('register.email') }}</label>
              <input
                id="email"
                type="email"
                v-model="form.email"
                :placeholder="$t('register.emailPlaceholder')"
                class="form-input"
                autocomplete="email"
                required
              />
            </div>

            <!-- 密码 -->
            <div class="form-group">
              <label for="password">{{ $t('register.password') }}</label>
              <input
                id="password"
                type="password"
                v-model="form.password"
                :placeholder="$t('register.passwordPlaceholder')"
                class="form-input"
                autocomplete="new-password"
                required
                minlength="6"
              />
            </div>

            <!-- 确认密码 -->
            <div class="form-group">
              <label for="confirmPassword">{{ $t('register.confirmPassword') }}</label>
              <input
                id="confirmPassword"
                type="password"
                v-model="form.confirmPassword"
                :placeholder="$t('register.confirmPasswordPlaceholder')"
                class="form-input"
                autocomplete="new-password"
                required
                minlength="6"
              />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { register, isAuthenticated } from '../services/authService'

const router = useRouter()
const { t } = useI18n()

// 表单数据 - removed role, always buyer
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// 如果已登录，重定向到首页
onMounted(() => {
  if (isAuthenticated()) {
    router.push('/')
  }
})

// 处理注册
const handleRegister = async () => {
  // 清除之前的消息
  errorMessage.value = ''
  successMessage.value = ''
  
  // 表单验证
  if (!form.value.username.trim()) {
    errorMessage.value = t('register.error.usernameRequired')
    return
  }
  
  if (!form.value.email.trim()) {
    errorMessage.value = t('register.error.emailRequired')
    return
  }
  
  // 简单邮箱格式验证
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
  
  isLoading.value = true
  
  try {
    // 调用注册服务 - role is hardcoded as 'customer'
    const result = await register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      role: 'customer' // Always customer
    })
    
    if (result.success) {
      successMessage.value = t('register.success')
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      errorMessage.value = result.message || t('register.error.registrationFailed')
    }
  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = t('register.error.registrationFailed')
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

.register-container {
  width: 100%;
  max-width: 500px;
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