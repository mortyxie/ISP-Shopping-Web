<template>
  <div class="seller-dashboard-page">
    <div class="container">
      <!-- 未登录提示 -->
      <div v-if="!isLoggedIn" class="not-logged-in">
        <div class="login-prompt">
          <h2>{{ $t('seller.notSeller') }}</h2>
          <p>{{ $t('seller.pleaseLogin') }}</p>
          <router-link to="/login" class="btn-primary">
            {{ $t('common.login') }}
          </router-link>
        </div>
      </div>

      <!-- 无权限提示 -->
      <div v-else-if="!isSeller" class="no-permission">
        <div class="permission-card">
          <h2>🔒 {{ $t('seller.noPermission') }}</h2>
          <p>{{ $t('seller.requireSeller') }}</p>
        </div>
      </div>

      <!-- 商家端内容 -->
      <div v-else class="seller-container">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
        </div>

        <!-- Dashboard 内容 -->
        <div v-else-if="dashboardData" class="dashboard-content">
          <h1 class="page-title">{{ $t('seller.title') }}</h1>
          <p class="welcome-text">{{ $t('seller.welcome', { username: dashboardData.sellerInfo?.username || '' }) }}</p>

          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <div class="stat-content">
                <div class="stat-value">{{ dashboardData.stats?.total_products || 0 }}</div>
                <div class="stat-label">{{ $t('seller.totalProducts') }}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">💿</div>
              <div class="stat-content">
                <div class="stat-value">{{ dashboardData.stats?.total_albums || 0 }}</div>
                <div class="stat-label">{{ $t('seller.totalAlbums') }}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ dashboardData.stats?.pending_orders || 0 }}</div>
                <div class="stat-label">{{ $t('seller.pendingOrders') }}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">{{ dashboardData.stats?.paid_orders || 0 }}</div>
                <div class="stat-label">{{ $t('seller.paidOrders') }}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <div class="stat-content">
                <div class="stat-value">{{ dashboardData.stats?.completed_orders || 0 }}</div>
                <div class="stat-label">{{ $t('seller.completedOrders') }}</div>
              </div>
            </div>
          </div>

          <!-- 最近订单 -->
          <div class="recent-orders">
            <h2 class="section-title">{{ $t('seller.recentOrders') }}</h2>
            <div v-if="dashboardData.recentOrders.length === 0" class="empty-state">
              <p>{{ $t('seller.noOrders') }}</p>
            </div>
            <div v-else class="orders-list">
              <div v-for="order in dashboardData.recentOrders" :key="order.order_id" class="order-card">
                <div class="order-header">
                  <span class="order-id">{{ $t('seller.order') }} #{{ order.order_id }}</span>
                  <span class="order-status" :class="'status-' + order.status">
                    {{ getOrderStatusText(order.status) }}
                  </span>
                  <span class="order-date">{{ formatDate(order.created_at) }}</span>
                </div>
                <div class="order-details">
                  <div class="order-info">
                    <span class="label">{{ $t('common.customer') }}:</span>
                    <span class="value">{{ order.customer_name || 'N/A' }}</span>
                  </div>
                  <div class="order-info">
                    <span class="label">{{ $t('seller.items') }}:</span>
                    <span class="value">{{ order.item_count || 0 }}</span>
                  </div>
                  <div class="order-info">
                    <span class="label">{{ $t('seller.amount') }}:</span>
                    <span class="value">¥{{ (order.total_amount || 0).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h3>{{ $t('seller.quickActions') }}</h3>
            <div class="actions-grid">
              <router-link to="/orders" class="action-card">
                <div class="action-icon">📦</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('seller.manageOrders') }}</div>
                  <div class="action-desc">{{ $t('seller.manageOrdersDesc') }}</div>
                </div>
              </router-link>

              <router-link to="/cart" class="action-card">
                <div class="action-icon">🛒</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('common.cart') }}</div>
                  <div class="action-desc">{{ $t('seller.manageCartDesc') }}</div>
                </div>
              </router-link>

              <router-link to="/profile" class="action-card">
                <div class="action-icon">👤</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('profile.title') }}</div>
                  <div class="action-desc">{{ $t('seller.viewProfileDesc') }}</div>
                </div>
              </router-link>
            </div>
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
const isSeller = ref(false)
const dashboardData = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

// 检查登录状态
const checkAuthStatus = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
}

// 获取商家端数据
const fetchSellerDashboard = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/seller/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    dashboardData.value = response.data

    // 检查当前用户是否为商家
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
    isSeller.value = userInfo.role === 'seller'
  } catch (error) {
    console.error('Fetch seller dashboard error:', error)
    errorMessage.value = error.response?.data?.error || t('seller.fetchError')

    // 如果是认证错误或权限错误，跳转到登录页
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const statusMap = {
    'pending': t('seller.statusPending'),
    'paid': t('seller.statusPaid'),
    'shipped': t('seller.statusShipped'),
    'completed': t('seller.statusCompleted'),
    'cancelled': t('seller.statusCancelled')
  }
  return statusMap[status] || status
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

onMounted(() => {
  checkAuthStatus()
  if (isLoggedIn.value) {
    fetchSellerDashboard()
  }
})
</script>

<style scoped>
.seller-dashboard-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 1200px;
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

/* 无权限提示 */
.no-permission {
  text-align: center;
  padding: var(--spacing-xxxl) 0;
}

.permission-card {
  text-align: center;
  padding: var(--spacing-xxxl);
  background: #fff3cd;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  border: 2px solid #ff9800;
}

.permission-card h2 {
  font-size: var(--font-size-xxl);
  color: #dc2626;
  margin-bottom: var(--spacing-lg);
}

.permission-card p {
  color: #721c24;
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

/* Dashboard 内容 */
.dashboard-content {
  padding: var(--spacing-lg) 0;
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.welcome-text {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xxl);
  font-size: var(--font-size-lg);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}

.stat-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
  border: 2px solid var(--color-primary);
  transition: transform var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.stat-icon {
  font-size: var(--font-size-xxxl);
  margin-bottom: var(--spacing-sm);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-xxxl);
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

/* 最近订单 */
.recent-orders {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  margin-bottom: var(--spacing-xxl);
  box-shadow: var(--shadow-lg);
}

.section-title {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-card {
  background: white;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-base);
}

.order-card:hover {
  border-color: var(--color-primary);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-md);
}

.order-id {
  font-weight: 600;
  color: var(--color-text-primary);
}

.order-status {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-paid {
  background: #d4edda;
  color: #155724;
}

.status-shipped {
  background: #cce5ff;
  color: #004085;
}

.status-completed {
  background: #d1fae5;
  color: #0056b3;
}

.status-cancelled {
  background: #f8d7da;
  color: #6c757d;
}

.order-date {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.order-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.order-info {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  background: var(--color-bg-light);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm);
}

.order-info .label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.order-info .value {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 快捷操作 */
.quick-actions {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
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
@media (max-width: 992px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .order-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767.98px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .order-details {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
