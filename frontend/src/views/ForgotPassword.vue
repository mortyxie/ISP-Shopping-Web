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

    <!-- 邮箱跳转弹窗 -->
    <div v-if="showEmailModal" class="modal-overlay" @click="closeModal">
      <div class="email-modal" @click.stop>
        <div class="modal-icon">📧</div>
        <h2 class="modal-title">{{ $t('forgotPassword.emailSentTitle') }}</h2>
        <p class="modal-message">{{ $t('forgotPassword.emailSentMessage') }}</p>
        <p class="modal-email">{{ form.email }}</p>
        <div class="modal-actions">
          <button @click="goToResetPassword" class="modal-button primary">
            {{ $t('forgotPassword.openEmail') }}
          </button>
          <button @click="closeModal" class="modal-button secondary">
            {{ $t('forgotPassword.close') }}
          </button>
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
const showEmailModal = ref(false)

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
    // 调用后端 API 发送重置密码邮件
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: form.value.email
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      // 显示邮箱跳转弹窗
      showEmailModal.value = true
    } else {
      errorMessage.value = data.message || t('forgotPassword.error.general')
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    errorMessage.value = t('forgotPassword.error.general')
  } finally {
    isLoading.value = false
  }
}

// 关闭弹窗
const closeModal = () => {
  showEmailModal.value = false
}

// 前往重置密码页面
const goToResetPassword = () => {
  closeModal()
  router.push({
    path: '/reset-password',
    query: { email: form.value.email }
  })
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

/* 邮箱弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.email-modal {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease-out;
  border: 2px solid var(--color-primary);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  animation: bounce 1s ease-in-out;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.modal-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.modal-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.6;
}

.modal-email {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: bold;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  word-break: break-all;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-direction: column;
}

.modal-button {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.modal-button.primary {
  background: var(--color-primary);
  color: white;
}

.modal-button.primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.modal-button.secondary {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.modal-button.secondary:hover {
  background: var(--color-border);
}

/* 弹窗响应式 */
@media (min-width: 768px) {
  .modal-actions {
    flex-direction: row;
  }

  .modal-button {
    flex: 1;
  }
}
</style>