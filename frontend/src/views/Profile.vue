<template>
  <div class="profile-page">
    <div class="container">
      <!-- 未登录提示 -->
      <div v-if="!isLoggedIn" class="not-logged-in">
        <div class="login-prompt">
          <h2>{{ $t('profile.notLoggedIn') }}</h2>
          <p>{{ $t('profile.pleaseLogin') }}</p>
          <router-link to="/login" class="btn-primary">
            {{ $t('common.login') }}
          </router-link>
        </div>
      </div>

      <!-- 已登录内容 -->
      <div v-else class="profile-container">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
        </div>

        <!-- 用户信息 -->
        <div v-else-if="user" class="profile-content">
          <h1 class="page-title">{{ $t('profile.title') }}</h1>

          <!-- 用户卡片 -->
          <div class="user-card">
            <div class="avatar-section">
              <div class="avatar">
                {{ user.username ? user.username.charAt(0).toUpperCase() : 'U' }}
              </div>
              <h3 class="username">{{ user.username }}</h3>
              <span class="role-badge">{{ getRoleLabel(user.role) }}</span>
            </div>

            <div class="info-section">
              <div class="info-item">
                <label>{{ $t('common.email') }}</label>
                <span>{{ user.email }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('profile.userId') }}</label>
                <span>{{ user.user_id }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('profile.registeredDate') }}</label>
                <span>{{ formatDate(user.created_at) }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('profile.orderCount') }}</label>
                <span>{{ user.orderCount || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h3>{{ $t('profile.quickActions') }}</h3>

            <div class="actions-grid">
              <router-link to="/orders" class="action-card">
                <div class="action-icon">📦</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('profile.myOrders') }}</div>
                  <div class="action-desc">{{ $t('profile.viewOrders') }}</div>
                </div>
              </router-link>

              <router-link to="/wishlist" class="action-card">
                <div class="action-icon">❤️</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('profile.myWishlist') }}</div>
                  <div class="action-desc">{{ $t('profile.viewWishlist') }}</div>
                </div>
              </router-link>

              <router-link to="/cart" class="action-card">
                <div class="action-icon">🛒</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('profile.myCart') }}</div>
                  <div class="action-desc">{{ $t('profile.viewCart') }}</div>
                </div>
              </router-link>

              <button @click="handleLogout" class="action-card logout-card">
                <div class="action-icon">🚪</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('profile.logout') }}</div>
                  <div class="action-desc">{{ $t('profile.logoutDesc') }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- 密码修改提示 -->
          <div class="password-tip">
            <p>{{ $t('profile.forgotPasswordTip') }}
              <router-link to="/forgot-password" class="link">
                {{ $t('common.forgotPassword') }}
              </router-link>
            </p>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const router = useRouter()
const { t } = useI18n()

const isLoggedIn = ref(false)
const user = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

// 检查登录状态
const checkAuthStatus = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
}

// 获取用户信息
const fetchUserProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    user.value = response.data
  } catch (error) {
    console.error('Fetch profile error:', error)
    errorMessage.value = error.response?.data?.error || t('profile.fetchError')

    // 如果是认证错误，跳转到登录页
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

// 获取角色标签
const getRoleLabel = (role) => {
  const roleMap = {
    'customer': t('profile.customer'),
    'seller': t('profile.seller'),
    'admin': t('profile.admin')
  }
  return roleMap[role] || role
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 退出登录
const handleLogout = () => {
  if (confirm(t('profile.logoutConfirm'))) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}

onMounted(() => {
  checkAuthStatus()
  if (isLoggedIn.value) {
    fetchUserProfile()
  }
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* 未登录提示 */
.not-logged-in {
  padding: var(--spacing-xxxl) 0;
}

.login-prompt {
  text-align: center;
  padding: var(--spacing-xxxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.login-prompt h2 {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.login-prompt p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xxxl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 个人信息内容 */
.profile-container {
  padding: var(--spacing-lg) 0;
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-weight: bold;
}

/* 用户卡片 */
.user-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  margin-bottom: var(--spacing-xxl);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
  display: flex;
  gap: var(--spacing-xxl);
  align-items: flex-start;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
}

.avatar {
  width: 100px;
  height: 100px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xxxl);
  font-weight: bold;
  margin-bottom: var(--spacing-md);
}

.username {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.role-badge {
  background: var(--color-accent);
  color: var(--color-primary-dark);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

/* 信息区域 */
.info-section {
  flex: 1;
}

.info-item {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  display: block;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.info-item span {
  display: block;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: 500;
}

/* 快捷操作 */
.quick-actions {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.quick-actions h3 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.action-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  transition: all var(--transition-base);
  cursor: pointer;
}

.action-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-card.logout-card {
  background: #fff0f0;
  border-color: #ffccc7;
}

.action-card.logout-card:hover {
  border-color: var(--color-accent);
  background: #ffe5e5;
}

.action-icon {
  font-size: var(--font-size-xxxl);
  flex-shrink: 0;
}

.action-text {
  flex: 1;
}

.action-title {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.action-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 密码提示 */
.password-tip {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.password-tip .link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.password-tip .link:hover {
  text-decoration: underline;
}

/* 错误信息 */
.error-message {
  background: var(--color-accent);
  color: var(--color-primary-dark);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  text-align: center;
  margin-top: var(--spacing-lg);
  border: 1px solid var(--color-primary-light);
}

/* 响应式设计 */
@media (max-width: 767.98px) {
  .user-card {
    flex-direction: column;
    text-align: center;
  }

  .info-section {
    width: 100%;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
