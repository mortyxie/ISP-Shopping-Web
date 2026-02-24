<template>
  <div class="category-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ $t('category.title') }}</h1>
        <p class="page-subtitle">{{ $t('category.subtitle') }}</p>
      </div>

      <div class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
          @click="goToCategory(category.id)"
        >
          <div class="category-icon">
            <span class="icon-emoji">{{ category.icon }}</span>
          </div>
          <h3 class="category-name">{{ category.name }}</h3>
          <p class="category-description">{{ category.description }}</p>
          <div class="category-footer">
            <span class="category-count">{{ category.count }} {{ $t('category.items') }}</span>
            <span class="category-arrow">→</span>
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

// 分类数据
const categories = ref([
  {
    id: 1,
    name: t('category.rock'),
    icon: '🎸',
    description: t('category.rockDesc'),
    count: 156
  },
  {
    id: 2,
    name: t('category.pop'),
    icon: '🎤',
    description: t('category.popDesc'),
    count: 203
  },
  {
    id: 3,
    name: t('category.jazz'),
    icon: '🎷',
    description: t('category.jazzDesc'),
    count: 89
  },
  {
    id: 4,
    name: t('category.classical'),
    icon: '🎻',
    description: t('category.classicalDesc'),
    count: 124
  },
  {
    id: 5,
    name: t('category.electronic'),
    icon: '🎹',
    description: t('category.electronicDesc'),
    count: 98
  },
  {
    id: 6,
    name: t('category.hiphop'),
    icon: '🎧',
    description: t('category.hiphopDesc'),
    count: 67
  },
  {
    id: 7,
    name: t('category.folk'),
    icon: '🪕',
    description: t('category.folkDesc'),
    count: 45
  },
  {
    id: 8,
    name: t('category.metal'),
    icon: '🤘',
    description: t('category.metalDesc'),
    count: 78
  },
  {
    id: 9,
    name: t('category.punk'),
    icon: '🎸',
    description: t('category.punkDesc'),
    count: 56
  },
  {
    id: 10,
    name: t('category.blues'),
    icon: '🎵',
    description: t('category.bluesDesc'),
    count: 34
  },
  {
    id: 11,
    name: t('category.country'),
    icon: '🎪',
    description: t('category.countryDesc'),
    count: 42
  },
  {
    id: 12,
    name: t('category.world'),
    icon: '🌍',
    description: t('category.worldDesc'),
    count: 28
  }
])

// 跳转到分类
const goToCategory = (categoryId) => {
  router.push({
    path: '/search',
    query: { category: categoryId }
  })
}
</script>

<style scoped>
.category-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.page-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.category-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

.category-card:hover::before {
  transform: scaleX(1);
}

.category-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base);
}

.category-card:hover .category-icon {
  transform: scale(1.1) rotate(5deg);
}

.icon-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.category-name {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: bold;
}

.category-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  flex: 1;
}

.category-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.category-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.category-arrow {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  transition: transform var(--transition-base);
}

.category-card:hover .category-arrow {
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }

  .category-card {
    padding: var(--spacing-lg);
  }

  .category-icon {
    width: 60px;
    height: 60px;
  }

  .icon-emoji {
    font-size: 2rem;
  }
}

@media (max-width: 576px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
