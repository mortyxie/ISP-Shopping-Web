<template>
  <header class="header">
    <div class="container header-container">
      <!-- Logo 和平台名称 -->
      <div class="header-logo" @click="$router.push('/')">
        <h1 class="logo-text">{{ $t('header.logo') }}</h1>
      </div>

      <!-- 搜索框 -->
      <div class="header-search">
        <input
          type="text"
          class="search-input"
          :placeholder="$t('header.searchPlaceholder')"
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">{{ $t('header.search') }}</button>
      </div>

      <!-- 右侧功能区 -->
      <div class="header-actions">
        <!-- 语言切换 -->
        <div class="action-item language-menu" @click="toggleLanguageMenu">
          <span class="action-icon">🌐</span>
          <span class="action-text">{{ currentLanguageText }}</span>
          <div class="language-dropdown" v-if="showLanguageMenu">
            <div 
              class="dropdown-item" 
              :class="{ active: currentLocale === 'zh-CN' }"
              @click="changeLanguage('zh-CN')"
            >
              {{ $t('language.zh-CN') }}
            </div>
            <div 
              class="dropdown-item" 
              :class="{ active: currentLocale === 'zh-TW' }"
              @click="changeLanguage('zh-TW')"
            >
              {{ $t('language.zh-TW') }}
            </div>
            <div 
              class="dropdown-item" 
              :class="{ active: currentLocale === 'en' }"
              @click="changeLanguage('en')"
            >
              {{ $t('language.en') }}
            </div>
          </div>
        </div>

        <!-- 购物车 -->
        <div class="action-item" @click="$router.push('/cart')">
          <span class="action-icon">🛒</span>
          <span class="action-text">{{ $t('header.cart') }}</span>
          <span class="cart-badge" v-if="cartCount > 0">{{ cartCount }}</span>
        </div>

        <!-- 用户菜单 -->
        <div class="action-item" v-if="!isLoggedIn" @click="$router.push('/login')">
          <span class="action-icon">👤</span>
          <span class="action-text">{{ $t('header.login') }}</span>
        </div>
        <div class="action-item user-menu" v-else @click="toggleUserMenu">
          <span class="action-icon">👤</span>
          <span class="action-text">{{ username || $t('header.user') }}</span>
          <div class="user-dropdown" v-if="showUserMenu">
            <div class="dropdown-item" @click="$router.push('/profile')">{{ $t('header.profile') }}</div>
            <div class="dropdown-item" @click="$router.push('/orders')">{{ $t('header.orders') }}</div>
            <div class="dropdown-item" @click="$router.push('/wishlist')">{{ $t('header.wishlist') }}</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" @click="handleLogout">{{ $t('header.logout') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="header-nav">
      <div class="container">
        <div class="nav-items">
          <router-link to="/" class="nav-item">{{ $t('header.nav.home') }}</router-link>
          <router-link to="/category" class="nav-item">{{ $t('header.nav.category') }}</router-link>
          <router-link to="/forum" class="nav-item">{{ $t('header.nav.forum') }}</router-link>
          <router-link to="/help" class="nav-item">{{ $t('header.nav.help') }}</router-link>
          <router-link to="/about" class="nav-item">{{ $t('header.nav.about') }}</router-link>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCurrentUser, logout, getCartCount } from '../utils/auth'

const router = useRouter()
const { locale, t } = useI18n()

// 搜索相关
const searchKeyword = ref('')

// 用户状态
const isLoggedIn = ref(false)
const username = ref('')
const cartCount = ref(0)

// 用户菜单
const showUserMenu = ref(false)

// 语言菜单
const showLanguageMenu = ref(false)
const currentLocale = computed(() => locale.value)

const currentLanguageText = computed(() => {
  return t(`language.${locale.value}`)
})

// 更新用户状态
const updateUserState = () => {
  const user = getCurrentUser()
  // 更新购物车数量（无论是否登录都显示）
  cartCount.value = getCartCount()
  
  if (user) {
    isLoggedIn.value = true
    username.value = user.name || user.username
  } else {
    isLoggedIn.value = false
    username.value = ''
  }
}

// 监听storage变化（用于跨标签页同步）
const handleStorageChange = (e) => {
  if (e.key === 'currentUser' || e.key === 'cart') {
    updateUserState()
  }
}

// 监听购物车更新事件
const handleCartUpdate = () => {
  updateUserState()
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { keyword: searchKeyword.value }
    })
  }
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showLanguageMenu.value = false
}

const toggleLanguageMenu = () => {
  showLanguageMenu.value = !showLanguageMenu.value
  showUserMenu.value = false
}

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  showLanguageMenu.value = false
}

const handleLogout = () => {
  logout()
  updateUserState()
  showUserMenu.value = false
  // 触发自定义事件，通知其他组件
  window.dispatchEvent(new Event('userStateChanged'))
  router.push('/')
}

// 点击外部关闭菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.user-menu')) {
    showUserMenu.value = false
  }
  if (!e.target.closest('.language-menu')) {
    showLanguageMenu.value = false
  }
}

onMounted(() => {
  updateUserState()
  window.addEventListener('storage', handleStorageChange)
  // 监听自定义事件（同标签页内登录/登出）
  window.addEventListener('userStateChanged', updateUserState)
  // 监听购物车更新事件
  window.addEventListener('cartUpdated', handleCartUpdate)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('userStateChanged', updateUserState)
  window.removeEventListener('cartUpdated', handleCartUpdate)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.header {
  background-color: var(--color-bg);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-md);
  gap: var(--spacing-lg);
}

.header-logo {
  cursor: pointer;
  flex-shrink: 0;
}

.logo-text {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  font-weight: bold;
  margin: 0;
}

.header-search {
  flex: 1;
  max-width: 600px;
  display: flex;
  gap: var(--spacing-sm);
}

.search-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color var(--transition-base);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  color: var(--color-text-primary);
}

.search-input::placeholder {
  color: var(--color-text-light);
}

.search-input:focus {
  border-color: rgba(220, 38, 38, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.search-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: rgba(220, 38, 38, 0.3);
  color: var(--color-primary);
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--transition-base);
}

.search-btn:hover {
  background-color: rgba(220, 38, 38, 0.4);
  border-color: rgba(220, 38, 38, 0.4);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base);
  position: relative;
}

.action-item:hover {
  background-color: var(--color-bg-light);
}

.action-icon {
  font-size: var(--font-size-lg);
}

.action-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-full);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: bold;
}

.user-menu,
.language-menu {
  position: relative;
}

.user-dropdown,
.language-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--spacing-xs);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 150px;
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  transition: background-color var(--transition-base);
}

.dropdown-item:hover {
  background-color: var(--color-bg-light);
}

.dropdown-item.active {
  background-color: var(--color-accent);
  color: var(--color-primary);
  font-weight: bold;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-xs) 0;
}

.header-nav {
  background-color: var(--color-primary);
  border-top: 1px solid var(--color-primary-dark);
}

.nav-items {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-sm) 0;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: var(--font-size-base);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base);
}

.nav-item:hover,
.nav-item.router-link-active {
  background-color: var(--color-primary-dark);
}

/* 响应式设计 */
@media (max-width: 767.98px) {
  .header-container {
    flex-wrap: wrap;
  }

  .header-search {
    order: 3;
    width: 100%;
    max-width: 100%;
    margin-top: var(--spacing-sm);
  }

  .action-text {
    display: none;
  }

  /* 移动端保留语言切换图标 */
  .language-menu .action-icon {
    display: block;
  }

  .nav-items {
    overflow-x: auto;
    gap: var(--spacing-md);
  }
}
</style>
