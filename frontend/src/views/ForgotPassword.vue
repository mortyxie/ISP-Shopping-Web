<template>
  <div class="forgot-password-page">
    <div class="container">
      <div class="forgot-password-container">
        <div class="forgot-password-card">
          <h1 class="page-title">{{ $t('forgotPassword.title') }}</h1>
          <p class="subtitle">{{ $t('forgotPassword.subtitle') }}</p>

          <form @submit.prevent="handleForgotPassword" class="forgot-password-form">
            <!-- 邮箱输入框 -->
            <div class="form-group">
              <label for="email">{{ $t('forgotPassword.email') }}</label>
              <input
                id="email"
                type="email"
                v-model="form.email"
                :placeholder="$t('forgotPassword.emailPlaceholder')"
                class="form-input"
                autocomplete="email"
                required
              />
            </div>

            <!-- 错误信息 -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <!-- 提交按钮 -->
            <button
              type="submit"
              class="submit-button"
              :disabled="isLoading"
            >
              {{ isLoading ? $t('forgotPassword.sending') : $t('forgotPassword.sendButton') }}
            </button>
          </form>

          <!-- 返回登录 -->
          <div class="back-to-login">
            <router-link to="/login" class="link">
              ← {{ $t('forgotPassword.backToLogin') }}
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

const form = ref({
  email: ''
})

const errorMessage = ref('')
const isLoading = ref(false)

// 发送重置密码链接
const handleForgotPassword = async () => {
  // 清除之前的消息
  errorMessage.value = ''

  // 验证输入
  if (!form.value.email.trim()) {
    errorMessage.value = t('forgotPassword.error.emailRequired')
    return
  }

  // 简单邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    errorMessage.value = t('forgotPassword.error.emailInvalid')
    return
  }

  isLoading.value = true

  try {
    // Just redirect to reset password page with email
    router.push({
      path: '/reset-password',
      query: { email: form.value.email }
    })
  } catch (error) {
    console.error('Redirect error:', error)
    errorMessage.value = t('forgotPassword.error.general')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
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
.forgot-password-page::before {
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

.forgot-password-page::after {
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

.forgot-password-container {
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.forgot-password-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.forgot-password-form {
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

.submit-button {
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

.submit-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-to-login {
  text-align: center;
  margin-top: var(--spacing-lg);
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-base);
  font-size: var(--font-size-sm);
}

.link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 767.98px) {
  .forgot-password-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-md);
  }

  .page-title {
    font-size: var(--font-size-xxl);
  }
}
</style>