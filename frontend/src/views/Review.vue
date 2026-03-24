<template>
  <div class="review-page">
    <div class="container">
      <div class="page-header">
        <button class="back-btn" @click="$router.back()">← {{ $t('review.back') }}</button>
        <h1>{{ albumTitle }}</h1>
        <p>{{ albumArtist }}</p>
      </div>

      <!-- Review Summary -->
      <div class="summary-card" v-if="reviews.length">
        <div class="avg-score">{{ avgRating.toFixed(1) }}</div>
        <div class="stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= Math.round(avgRating) }">★</span>
        </div>
        <div class="count">{{ reviews.length }} {{ $t('review.reviews') }}</div>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        <div v-if="reviews.length === 0" class="no-reviews">
          <p>{{ $t('review.noReviews') }}</p>
        </div>

        <div v-else class="review-card" v-for="review in reviews" :key="review.review_id">
          <div class="review-header">
            <div class="user-info">
              <div class="avatar">{{ (review.username || 'U').charAt(0).toUpperCase() }}</div>
              <div class="user-details">
                <span class="username">{{ review.username }}</span>
                <span class="user-role" v-if="review.role === 'admin' || review.role === 'seller'">
                  ({{ review.role === 'admin' ? 'Admin' : 'Seller' }})
                </span>
                <span class="date">{{ formatDate(review.created_at) }}</span>
              </div>
            </div>
            <div class="rating">
              <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= review.rating }">★</span>
            </div>
          </div>
          <div class="product-badge" v-if="review.sku_condition">
            {{ $t('review.version') }}: {{ review.sku_condition }} | Product ID: {{ review.product_id }}
          </div>
          <div class="review-comment">{{ review.comment }}</div>
          
          <!-- Reply Button - Always Visible -->
          <div class="reply-section">
            <button class="reply-btn" @click="toggleReplyForm(review.review_id)">
              💬 {{ $t('review.reply') }} ({{ getReplyCount(review.replies) }})
            </button>
            
            <!-- Reply Form -->
            <div v-if="activeReplyForm === review.review_id" class="reply-form">
              <textarea 
                v-model="replyContent" 
                :placeholder="$t('review.replyPlaceholder')"
                rows="3"
                class="reply-textarea"
              ></textarea>
              <div class="reply-actions">
                <button class="btn-submit-reply" @click="submitReply(review.review_id)" :disabled="submitting">
                  {{ submitting ? $t('review.submitting') : $t('review.submitReply') }}
                </button>
                <button class="btn-cancel-reply" @click="cancelReplyForm">
                  {{ $t('review.cancel') }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Display Replies - Using ReplyThread component (no reply buttons inside) -->
          <div v-if="review.replies && review.replies.length > 0" class="replies-container">
            <ReplyThread 
              :replies="review.replies" 
              @reply-added="refreshReplies"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAlbumWithProducts } from '../services/albumService'
import { getAlbumAverageRating } from '../services/reviewService'
import { isAuthenticated } from '../services/authService'
import ReplyThread from './ReplyThread.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const albumId = ref(null)
const albumTitle = ref('')
const albumArtist = ref('')
const reviews = ref([])
const avgRating = ref(0)

// Reply state
const activeReplyForm = ref(null)
const replyContent = ref('')
const submitting = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getReplyCount = (replies) => {
  if (!replies) return 0
  return replies.length
}

const toggleReplyForm = (reviewId) => {
  if (!isAuthenticated()) {
    alert(t('review.loginToReply'))
    return
  }
  activeReplyForm.value = activeReplyForm.value === reviewId ? null : reviewId
  replyContent.value = ''
}

const cancelReplyForm = () => {
  activeReplyForm.value = null
  replyContent.value = ''
}

const submitReply = async (reviewId) => {
  if (!replyContent.value.trim()) {
    alert(t('review.replyRequired'))
    return
  }
  
  if (replyContent.value.length > 500) {
    alert(t('review.replyTooLong'))
    return
  }
  
  submitting.value = true
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: replyContent.value.trim(),
        parent_reply_id: null
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      replyContent.value = ''
      activeReplyForm.value = null
      await refreshReplies()
      alert(t('review.replySuccess'))
    } else {
      alert(data.error || t('review.replyFailed'))
    }
  } catch (error) {
    console.error('Failed to submit reply:', error)
    alert(t('review.replyFailed'))
  } finally {
    submitting.value = false
  }
}

const refreshReplies = async () => {
  await loadReviews()
}

const loadReviews = async () => {
  try {
    const response = await fetch(`/api/reviews/album/${albumId.value}`)
    if (response.ok) {
      reviews.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load reviews:', error)
  }
}

const loadData = async () => {
  try {
    albumId.value = parseInt(route.params.id)
    const album = await getAlbumWithProducts(albumId.value)
    albumTitle.value = album.title
    albumArtist.value = album.artist
    
    const ratingData = await getAlbumAverageRating(albumId.value)
    avgRating.value = ratingData.avg_rating
    
    await loadReviews()
    
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.review-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 2px solid var(--color-primary);
  text-align: center;
  position: relative;
}

.back-btn {
  position: absolute;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
}

.page-header h1 {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.page-header p {
  color: var(--color-text-secondary);
  margin: 0;
}

.summary-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.avg-score {
  font-size: 3rem;
  font-weight: bold;
  color: var(--color-primary);
}

.star {
  font-size: 1.5rem;
  color: #d1d5db;
}

.star.active {
  color: #f59e0b;
}

.count {
  color: var(--color-text-secondary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.no-reviews {
  text-align: center;
  padding: var(--spacing-xxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  color: var(--color-text-secondary);
}

.review-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--font-size-lg);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  color: var(--color-text-primary);
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  margin-left: var(--spacing-xs);
}

.date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.rating .star {
  font-size: var(--font-size-base);
}

.product-badge {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-bg-light);
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-sm);
}

.review-comment {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-top: var(--spacing-sm);
}

/* Reply Section */
.reply-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.reply-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  transition: color var(--transition-base);
}

.reply-btn:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.reply-form {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.reply-textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  resize: vertical;
  font-family: inherit;
}

.reply-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.reply-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.btn-submit-reply {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.btn-submit-reply:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-submit-reply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel-reply {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-light);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.btn-cancel-reply:hover {
  background: var(--color-border);
}

.replies-container {
  margin-top: var(--spacing-md);
}

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>