<template>
  <div class="reset-password-page">
    <div class="container">
      <div class="reset-password-container">
        <div class="reset-password-card">
          <h1 class="page-title">重设密码</h1>
          <p class="subtitle">请输入您的新密码</p>

          <form @submit.prevent="handleResetPassword" class="reset-password-form">
            <!-- 邮箱显示（只读） -->
            <div class="form-group">
              <label for="email">邮箱地址</label>
              <input
                id="email"
                type="email"
                v-model="form.email"
                placeholder="请输入您注册时使用的邮箱"
                class="form-input"
                autocomplete="email"
                readonly
              />
              <p class="hint">邮箱不可修改，如有问题请重新申请重置</p>
            </div>

            <!-- 新密码 -->
            <div class="form-group">
              <label for="newPassword">新密码</label>
              <input
                id="newPassword"
                type="password"
                v-model="form.newPassword"
                placeholder="请输入新密码（至少6个字符）"
                class="form-input"
                autocomplete="new-password"
                required
                minlength="6"
              />
            </div>

            <!-- 确认新密码 -->
            <div class="form-group">
              <label for="confirmPassword">确认新密码</label>
              <input
                id="confirmPassword"
                type="password"
                v-model="form.confirmPassword"
                placeholder="请再次输入新密码"
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
              class="submit-button"
              :disabled="isLoading || !isFormValid"
            >
              {{ isLoading ? '重置中...' : '确认修改' }}
            </button>
          </form>

          <!-- 密码要求提示 -->
          <div class="password-requirements">
            <p class="requirements-title">密码要求：</p>
            <ul class="requirements-list">
              <li>至少6个字符</li>
              <li>建议包含字母和数字</li>
              <li>建议使用特殊字符增强安全性</li>
            </ul>
          </div>

          <!-- 返回登录 -->
          <div class="back-to-login">
            <router-link to="/login" class="link">
              ← 返回登录
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// 如果URL中有email参数，自动填充
const initialEmail = route.query.email || ''

const form = ref({
  email: initialEmail,
  newPassword: '',
  confirmPassword: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// 表单验证
const isFormValid = computed(() => {
  return form.value.email.trim() &&
         form.value.newPassword.length >= 6 &&
         form.value.confirmPassword.length >= 6 &&
         form.value.newPassword === form.value.confirmPassword
})

// 重设密码
const handleResetPassword = async () => {
  // 清除之前的消息
  errorMessage.value = ''
  successMessage.value = ''

  // 验证输入
  if (!form.value.email.trim()) {
    errorMessage.value = '请输入邮箱地址'
    return
  }

  // 简单邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    errorMessage.value = '请输入有效的邮箱地址'
    return
  }

  if (!form.value.newPassword) {
    errorMessage.value = '请输入新密码'
    return
  }

  if (form.value.newPassword.length < 6) {
    errorMessage.value = '密码至少需要6个字符'
    return
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true

  try {
    // 调用后端重置密码API
    const response = await axios.post('/api/auth/reset-password', {
      email: form.value.email,
      newPassword: form.value.newPassword
    })

    if (response.data.success) {
      successMessage.value = response.data.message || '密码重置成功！'

      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      errorMessage.value = response.data.message || '重置失败，请重试'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
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
.reset-password-page::before {
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

.reset-password-page::after {
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

.reset-password-container {
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
}

.reset-password-card {
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

.reset-password-form {
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

.form-input:readonly {
  background-color: var(--color-bg-light);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0 0;
  line-height: 1.4;
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

.password-requirements {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary);
}

.requirements-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requirements-list li {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) 0;
  line-height: 1.6;
}

.requirements-list li::before {
  content: '✓ ';
  color: var(--color-primary);
  font-weight: bold;
  margin-right: var(--spacing-xs);
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
  .reset-password-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-md);
  }

  .page-title {
    font-size: var(--font-size-xxl);
  }
}
</style>
