<template>
  <div class="login-page">
    <div class="container">
      <div class="login-container">
        <div class="login-card">
          <h1 class="login-title">{{ $t('login.title') }}</h1>
          
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="username">{{ $t('login.username') }}</label>
              <input
                id="username"
                type="text"
                v-model="form.username"
                :placeholder="$t('login.usernamePlaceholder')"
                class="form-input"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="password">{{ $t('login.password') }}</label>
              <input
                id="password"
                type="password"
                v-model="form.password"
                :placeholder="$t('login.passwordPlaceholder')"
                class="form-input"
                autocomplete="current-password"
              />
            </div>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <button 
              type="submit" 
              class="login-button"
              :disabled="isLoading"
            >
              {{ isLoading ? '登录中...' : $t('login.loginButton') }}
            </button>
          </form>

          <div class="login-links">
            <router-link to="/forgot-password" class="link">
              {{ $t('login.forgotPassword') }}
            </router-link>
            <span class="divider">|</span>
            <router-link to="/register" class="link">
              {{ $t('login.registerLink') }}
            </router-link>
          </div>

          <!-- 测试账号提示（开发阶段） -->
          <div class="test-accounts">
            <p class="test-title">{{ $t('login.testAccounts') }}</p>
            <div class="test-account-list">
              <p>{{ $t('login.testAccount1') }}</p>
              <p>{{ $t('login.testAccount2') }}</p>
              <p>{{ $t('login.testAccount3') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, isAuthenticated } from '../utils/auth'

const router = useRouter()

const form = ref({
  username: '',
  password: ''
})

const errorMessage = ref('')
const isLoading = ref(false)

// 如果已登录，重定向到首页
onMounted(() => {
  if (isAuthenticated()) {
    router.push('/')
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  
  // 验证输入
  if (!form.value.username.trim() || !form.value.password.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  isLoading.value = true

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 调用登录函数
  const result = login(form.value.username, form.value.password)

  isLoading.value = false

  if (result.success) {
    // 登录成功，触发状态更新事件
    window.dispatchEvent(new Event('userStateChanged'))
    // 跳转到首页
    router.push('/')
  } else {
    errorMessage.value = result.message || '用户名或密码错误'
  }
}
</script>

<style scoped>
.login-page {
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
.login-page::before {
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

.login-page::after {
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

.login-container {
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
}

.login-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.login-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-weight: bold;
}

.login-form {
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

.login-button {
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

.login-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-links {
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
}

.link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.divider {
  color: var(--color-text-light);
}

.test-accounts {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary);
}

.test-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  font-weight: bold;
}

.test-account-list {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.8;
}

.test-account-list p {
  margin: var(--spacing-xs) 0;
  font-family: monospace;
}

/* 响应式设计 */
@media (max-width: 767.98px) {
  .login-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-md);
  }

  .login-title {
    font-size: var(--font-size-xxl);
  }
}
</style>
