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

          <!-- 收货地址 -->
          <div class="address-section">
            <div class="section-header">
              <h3>收货地址</h3>
              <button @click="showAddressModal = true" class="btn-add">+ 添加地址</button>
            </div>

            <div v-if="isLoadingAddresses" class="loading">加载中...</div>

            <div v-else-if="addresses.length === 0" class="empty-address">暂无收货地址</div>

            <div v-else class="address-list">
              <div v-for="address in addresses" :key="address.address_id" class="address-item">
                <div class="address-info">
                  <div class="address-header">
                    <span class="recipient-name">{{ address.recipient_name }}</span>
                    <span v-if="address.is_default === 1" class="default-badge">默认</span>
                  </div>
                  <div class="address-details">
                    <p class="phone">{{ address.phone }}</p>
                    <p class="address-line">{{ address.address_line1 }}<span v-if="address.address_line2">，{{ address.address_line2 }}</span></p>
                    <p class="address-location">{{ address.city }}<span v-if="address.state">，{{ address.state }}</span>，{{ address.postal_code }}</p>
                    <p class="address-country">{{ address.country }}</p>
                  </div>
                </div>
                <div class="address-actions">
                  <button @click="editAddress(address)" class="btn-edit">编辑</button>
                  <button @click="deleteAddress(address.address_id)" class="btn-delete">删除</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷操作 - 买家视图 -->
          <div v-if="!isSeller" class="quick-actions">
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
                  <div class="action-title">{{ $t('common.cart') }}</div>
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

          <!-- 快捷操作 - 卖家视图 -->
          <div v-if="isSeller" class="quick-actions">
            <h3>{{ $t('profile.sellerActions') }}</h3>

            <div class="actions-grid">

              <router-link to="/seller" class="action-card">
                <div class="action-icon">📊</div>
                <div class="action-text">
                  <div class="action-title">{{ $t('profile.sellerDashboard') }}</div>
                  <div class="action-desc">{{ $t('profile.manageStore') }}</div>
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

    <!-- 地址模态框 -->
    <div v-if="showAddressModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ editingAddress ? '编辑地址' : '添加地址' }}</h3>
        <form @submit.prevent="saveAddress" class="address-form">
          <div class="form-group">
            <label>收件人姓名 *</label>
            <input v-model="addressForm.recipient_name" type="text" required />
          </div>
          <div class="form-group">
            <label>联系电话 *</label>
            <input v-model="addressForm.phone" type="tel" required />
          </div>
          <div class="form-group">
            <label>详细地址 *</label>
            <input v-model="addressForm.address_line1" type="text" required />
          </div>
          <div class="form-group">
            <label>地址补充信息</label>
            <input v-model="addressForm.address_line2" type="text" />
          </div>
          <div class="form-group">
            <label>城市 *</label>
            <input v-model="addressForm.city" type="text" required />
          </div>
          <div class="form-group">
            <label>省份/州</label>
            <input v-model="addressForm.state" type="text" />
          </div>
          <div class="form-group">
            <label>邮政编码 *</label>
            <input v-model="addressForm.postal_code" type="text" required />
          </div>
          <div class="form-group">
            <label>国家 *</label>
            <select v-model="addressForm.country" required>
              <option value="中国">中国</option>
              <option value="美国">美国</option>
              <option value="英国">英国</option>
              <option value="加拿大">加拿大</option>
              <option value="澳大利亚">澳大利亚</option>
              <option value="日本">日本</option>
              <option value="德国">德国</option>
              <option value="法国">法国</option>
              <option value="韩国">韩国</option>
              <option value="新加坡">新加坡</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="addressForm.is_default" type="checkbox" />
              <span>设为默认地址</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddressModal = false" class="btn-cancel">取消</button>
            <button type="submit" class="btn-save" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const isLoggedIn = ref(false)
const user = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

// 收货地址相关
const addresses = ref([])
const isLoadingAddresses = ref(false)
const showAddressModal = ref(false)
const editingAddress = ref(null)
const isSaving = ref(false)
const addressForm = ref({
  address_id: null,
  recipient_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '中国',
  is_default: false
})

// Check if user is seller
const isSeller = computed(() => {
  return user.value?.role === 'seller' || user.value?.role === 'admin'
})

// 检查登录状态
const checkAuthStatus = () => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('currentUser')
  isLoggedIn.value = !!token
  
  if (isLoggedIn.value && userStr) {
    try {
      const userData = JSON.parse(userStr)
      user.value = {
        username: userData.username,
        email: userData.email,
        role: userData.role,
        user_id: userData.id
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
    }
  }
}

// 获取用户信息
const fetchUserProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile')
    }

    user.value = data
  } catch (error) {
    console.error('Fetch profile error:', error)
    errorMessage.value = error.message || t('profile.fetchError')

    // 如果是认证错误，跳转到登录页
    if (error.message.includes('401') || error.message.includes('403')) {
      localStorage.removeItem('token')
      localStorage.removeItem('currentUser')
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

// ==================== 收货地址管理 ====================

// 加载收货地址
const loadAddresses = async () => {
  isLoadingAddresses.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/addresses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to load addresses')
    }

    const data = await response.json()
    addresses.value = data
  } catch (error) {
    console.error('Load addresses error:', error)
  } finally {
    isLoadingAddresses.value = false
  }
}

// 编辑地址
const editAddress = (address) => {
  editingAddress.value = address
  addressForm.value = {
    address_id: address.address_id,
    recipient_name: address.recipient_name,
    phone: address.phone,
    address_line1: address.address_line1,
    address_line2: address.address_line2 || '',
    city: address.city,
    state: address.state || '',
    postal_code: address.postal_code,
    country: address.country,
    is_default: address.is_default === 1
  }
  showAddressModal.value = true
}

// 保存地址
const saveAddress = async () => {
  if (!addressForm.value.recipient_name || !addressForm.value.phone ||
      !addressForm.value.address_line1 || !addressForm.value.city ||
      !addressForm.value.postal_code || !addressForm.value.country) {
    alert('请填写所有必填项')
    return
  }

  isSaving.value = true
  try {
    const token = localStorage.getItem('token')
    const isEditing = editingAddress.value !== null
    const url = isEditing ? `/api/addresses/${addressForm.value.address_id}` : '/api/addresses'
    const method = isEditing ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient_name: addressForm.value.recipient_name,
        phone: addressForm.value.phone,
        address_line1: addressForm.value.address_line1,
        address_line2: addressForm.value.address_line2,
        city: addressForm.value.city,
        state: addressForm.value.state,
        postal_code: addressForm.value.postal_code,
        country: addressForm.value.country,
        is_default: addressForm.value.is_default ? 1 : 0
      })
    })

    if (!response.ok) {
      throw new Error('Failed to save address')
    }

    alert(isEditing ? '地址已更新' : '地址已添加')
    showAddressModal.value = false
    resetAddressForm()
    loadAddresses()
  } catch (error) {
    console.error('Save address error:', error)
    alert('保存地址失败')
  } finally {
    isSaving.value = false
  }
}

// 删除地址
const deleteAddress = async (addressId) => {
  if (!confirm('确定要删除这个地址吗？')) {
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete address')
    }

    alert('地址已删除')
    loadAddresses()
  } catch (error) {
    console.error('Delete address error:', error)
    alert('删除地址失败')
  }
}

// 重置地址表单
const resetAddressForm = () => {
  addressForm.value = {
    address_id: null,
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '中国',
    is_default: false
  }
  editingAddress.value = null
}

// 退出登录
const handleLogout = () => {
  if (confirm(t('profile.logoutConfirm'))) {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    window.dispatchEvent(new Event('userStateChanged'))
    router.push('/login')
  }
}

onMounted(() => {
  checkAuthStatus()
  if (isLoggedIn.value) {
    fetchUserProfile()
    loadAddresses()
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

.btn-primary {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--transition-base), transform var(--transition-base);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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
  width: 100%;
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
  text-align: left;
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

/* ==================== 收货地址样式 ==================== */
.address-section {
  margin-top: var(--spacing-xxl);
  padding: var(--spacing-xl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h3 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0;
}

.btn-add {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-add:hover {
  background-color: var(--color-primary-dark);
}

.loading {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.empty-address {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border: 2px dashed var(--color-border);
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.address-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-lg);
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  transition: all 0.3s;
}

.address-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.address-item.default {
  border-color: var(--color-primary);
  background: #f0f9ff;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.recipient-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.default-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  font-size: var(--font-size-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.address-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.address-details p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.phone {
  font-size: var(--font-size-sm);
}

.address-line {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.address-location {
  font-size: var(--font-size-sm);
}

.address-country {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-top: var(--spacing-xs);
}

.address-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-lg);
}

.btn-edit {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: var(--color-primary-dark);
}

.btn-delete {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover {
  background: var(--color-accent-dark);
}

/* 模态框样式 */
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
  padding: var(--spacing-lg);
}

.modal-content {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxxl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-content h3 {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.address-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.address-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.address-form label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.address-form input,
.address-form select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  transition: border-color 0.3s;
}

.address-form input:focus,
.address-form select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.address-form .checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
}

.address-form .checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.address-form input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.address-form .form-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-cancel:hover {
  background: var(--color-border);
}

.btn-save {
  background: var(--color-primary);
  color: white;
}

.btn-save:hover {
  background: var(--color-primary-dark);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>