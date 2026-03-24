<template>
  <div class="reply-thread">
    <div v-for="reply in replies" :key="reply.reply_id" class="reply-item">
      <div class="reply-header">
        <span class="reply-username">{{ reply.username }}</span>
        <span class="reply-user-role" v-if="reply.role === 'admin' || reply.role === 'seller'">
          ({{ reply.role === 'admin' ? 'Admin' : 'Seller' }})
        </span>
        <span class="reply-date">{{ formatDate(reply.created_at) }}</span>
      </div>
      <div class="reply-content">{{ reply.content }}</div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  replies: {
    type: Array,
    required: true
  }
})

const { locale } = useI18n()

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
</script>

<style scoped>
.reply-thread {
  margin-top: var(--spacing-md);
  padding-left: var(--spacing-lg);
}

.reply-item {
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary);
}

.reply-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-xs);
  flex-wrap: wrap;
}

.reply-username {
  font-weight: bold;
  color: var(--color-text-primary);
}

.reply-user-role {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
}

.reply-date {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.reply-content {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
</style>