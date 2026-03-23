<template>
  <div class="home">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadData" class="btn-primary">
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- 第一板块：占满整个视口 -->
      <section class="hero-section">
        <!-- 秋叶装饰元素 -->
        <div class="phoenix-decoration">
          <div class="phoenix-flower flower-1">🍁</div>
          <div class="phoenix-flower flower-2">🍂</div>
          <div class="phoenix-flower flower-3">🍁</div>
          <div class="phoenix-flower flower-4">🍂</div>
          <div class="phoenix-petal petal-1"></div>
          <div class="phoenix-petal petal-2"></div>
          <div class="phoenix-petal petal-3"></div>
          <div class="phoenix-petal petal-4"></div>
        </div>
        <div class="container hero-container">
          <!-- 左半边：CD机动画 -->
          <div class="cd-player-wrapper">
            <div class="cd-player">
              <div class="cd-disc">
                <div class="cd-center"></div>
              </div>
            </div>
          </div>

          <!-- 右半边：论坛数据展示 -->
          <div class="forum-preview">
            <h2 class="forum-title">{{ $t('home.latestUpdates') }}</h2>
            <div class="forum-list">
              <div
                v-if="forumMessages.length === 0"
                class="forum-empty"
              >
                <p>{{ $t('home.noMessages') }}</p>
              </div>
              <div
                v-else
                v-for="item in forumMessages"
                :key="item.id"
                class="forum-item"
              >
                <div class="forum-item-header">
                  <span class="forum-user">{{ item.username || $t('home.anonymous') }}</span>
                  <span class="forum-time">{{ formatTime(item.created_at) }}</span>
                </div>
                <div class="forum-content">{{ item.content }}</div>
              </div>
            </div>
            <div class="forum-more" @click="$router.push('/forum')">
              {{ $t('home.viewMore') }} →
            </div>
          </div>
        </div>
      </section>

      <!-- 第二板块：Featured Albums with Pagination -->
      <section class="albums-section">
        <div class="container">
          <h2 class="section-title">{{ $t('home.featuredAlbums') }}</h2>
          
          <div v-if="allAlbums.length === 0" class="no-albums">
            <p>{{ $t('home.noAlbums') }}</p>
          </div>
          
          <div v-else>
            <!-- Albums Grid -->
            <div class="albums-grid">
              <div
                v-for="album in paginatedAlbums"
                :key="album.id"
                class="album-card"
                @click="$router.push(`/album/${album.id}`)"
              >
                <div class="album-image">
                  <img 
                    :src="album.image || getRecordPlaceholder(album.id)" 
                    :alt="album.title"
                    @error="handleImageError"
                  />
                </div>
                <div class="album-info">
                  <p class="album-title">{{ album.title }}</p>
                  <p class="album-artist">{{ album.artist }}</p>
                  <p class="album-count">{{ album.product_count }} {{ $t('albumDetail.availableCopies') }}</p>
                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="pagination-controls">
              <button 
                class="page-btn prev-btn" 
                @click="previousPage"
                :disabled="currentPage === 1"
              >
                ← {{ $t('home.previous') }}
              </button>
              
              <div class="page-info">
                {{ $t('home.page') }} {{ currentPage }} / {{ totalPages }}
              </div>
              
              <button 
                class="page-btn next-btn" 
                @click="nextPage"
                :disabled="currentPage === totalPages"
              >
                {{ $t('home.next') }} →
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAlbums } from '../services/albumService'
import { getForumMessages } from '../services/forumService'

const { t } = useI18n()

// State
const isLoading = ref(true)
const error = ref(null)
const allAlbums = ref([])
const forumMessages = ref([])
const isMobile = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 8

// Computed: Paginated albums
const paginatedAlbums = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return allAlbums.value.slice(start, end)
})

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(allAlbums.value.length / itemsPerPage)
})

// Pagination methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    // Scroll to top of albums section
    document.querySelector('.albums-section')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    document.querySelector('.albums-section')?.scrollIntoView({ behavior: 'smooth' })
  }
}

// Load data from database
const loadData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    console.log('📀 Loading albums from database...')
    const albumsData = await getAlbums()
    console.log('✅ Albums loaded:', albumsData)
    
    if (albumsData && albumsData.length > 0) {
      allAlbums.value = albumsData.map(album => ({
        id: album.album_id,
        title: album.title,
        artist: album.artist,
        image: album.cover_image_url,
        product_count: album.product_count || 0
      }))
    } else {
      console.log('⚠️ No albums found in database')
      allAlbums.value = []
    }

    console.log('💬 Loading forum messages...')
    const messages = await getForumMessages(10)
    
    if (messages && messages.length > 0) {
      forumMessages.value = messages
    } else {
      forumMessages.value = []
    }

  } catch (err) {
    console.error('❌ Failed to load home data:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// Format time for display
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return t('home.justNow')
  } else if (diffMins < 60) {
    return t('home.minutesAgo', { count: diffMins })
  } else if (diffHours < 24) {
    return t('home.hoursAgo', { count: diffHours })
  } else {
    return t('home.daysAgo', { count: diffDays })
  }
}

// Handle image load error
const handleImageError = (e) => {
  e.target.src = getRecordPlaceholder(1)
}

// 生成唱片封面占位图（SVG）
const getRecordPlaceholder = (id) => {
  const colors = [
    '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    '#ef4444', '#f87171', '#fca5a5', '#fecaca',
    '#1f2937', '#374151', '#4b5563', '#6b7280',
    '#111827', '#1f2937', '#374151', '#4b5563'
  ]
  const color = colors[(id || 1) % colors.length]
  const color2 = colors[((id || 1) + 1) % colors.length]
  
  const svg = `
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${id || 1}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#grad${id || 1})"/>
      <circle cx="150" cy="150" r="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <circle cx="150" cy="150" r="20" fill="rgba(255,255,255,0.4)"/>
      <text x="150" y="200" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle" font-weight="bold">💿</text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

// 检测设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}

// Lifecycle
onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
  loadData()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})
</script>

<style scoped>
.home {
  width: 100%;
}

/* Loading State */
.loading-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #FDC1A7;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(220, 38, 38, 0.3);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #FDC1A7;
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-base);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

/* 第一板块：占满整个视口 */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: #FDC1A7;
  padding: var(--spacing-xxl) 0;
  position: relative;
  overflow: hidden;
}

/* 凤凰花装饰 */
.phoenix-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.phoenix-flower {
  position: absolute;
  font-size: 3rem;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.flower-1 {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.flower-2 {
  top: 20%;
  right: 10%;
  animation-delay: 1s;
}

.flower-3 {
  bottom: 15%;
  left: 8%;
  animation-delay: 2s;
}

.flower-4 {
  bottom: 25%;
  right: 5%;
  animation-delay: 3s;
}

.phoenix-petal {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50% 0 50% 0;
  opacity: 0.2;
  animation: float 8s ease-in-out infinite;
}

.petal-1 {
  top: 30%;
  left: 15%;
  animation-delay: 0.5s;
}

.petal-2 {
  top: 50%;
  right: 20%;
  animation-delay: 1.5s;
}

.petal-3 {
  bottom: 40%;
  left: 25%;
  animation-delay: 2.5s;
}

.petal-4 {
  bottom: 30%;
  right: 15%;
  animation-delay: 3.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

.hero-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xxl);
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* CD机动画 */
.cd-player-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.cd-player {
  width: 400px;
  height: 400px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cd-disc {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: 
    radial-gradient(circle at center, transparent 30px, #374151 30px, #374151 32px, transparent 32px),
    radial-gradient(circle at center, transparent 60px, #374151 60px, #374151 62px, transparent 62px),
    radial-gradient(circle at center, transparent 90px, #374151 90px, #374151 92px, transparent 92px),
    radial-gradient(circle at center, transparent 120px, #374151 120px, #374151 122px, transparent 122px),
    linear-gradient(135deg, #1f2937 0%, #111827 100%);
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: rotate 10s linear infinite;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cd-center {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary);
  z-index: 1;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 论坛数据展示 */
.forum-preview {
  background: var(--color-bg);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  height: 500px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.forum-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-md);
}

.forum-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.forum-list::-webkit-scrollbar {
  display: none;
}

.forum-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.forum-item {
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.forum-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.forum-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.forum-user {
  color: var(--color-primary);
  font-weight: bold;
}

.forum-time {
  color: var(--color-text-secondary);
}

.forum-content {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: 1.6;
}

.forum-more {
  margin-top: var(--spacing-md);
  text-align: center;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: bold;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base);
}

.forum-more:hover {
  background-color: var(--color-accent);
}

/* 第二板块：Albums Section */
.albums-section {
  padding: var(--spacing-xxl) 0;
  background: var(--color-bg);
}

.section-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xxl);
  font-weight: bold;
}

.no-albums {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.album-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.album-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-light);
}

.album-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.album-card:hover .album-image img {
  transform: scale(1.05);
}

.album-info {
  padding: var(--spacing-md);
}

.album-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-artist {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-count {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  margin: 0;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xxl);
  padding: var(--spacing-lg);
}

.page-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: bold;
  transition: all var(--transition-base);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .albums-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
  
  .cd-player {
    width: 300px;
    height: 300px;
  }
  
  .cd-disc {
    width: 250px;
    height: 250px;
  }
}

@media (max-width: 767.98px) {
  .albums-grid {
    grid-template-columns: 1fr;
  }
}
</style>