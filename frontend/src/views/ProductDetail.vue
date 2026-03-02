<template>
  <div class="product-detail-page">
    <div class="container">
      <div class="product-main">
        <!-- 左侧：商品大图 -->
        <div class="product-image-section">
          <div class="main-image-wrapper">
            <img :src="productImage" :alt="productName" class="main-image" />
          </div>
        </div>

        <!-- 右侧：成色选择和商品列表 -->
        <div class="product-info-section">
          <h1 class="product-title">{{ productName }}</h1>
          
          <!-- 成色类别选择 -->
          <div class="condition-selector">
            <h3 class="selector-title">{{ $t('productDetail.selectCondition') }}</h3>
            <div class="condition-tabs">
              <button
                v-for="condition in conditions"
                :key="condition.value"
                class="condition-tab"
                :class="{ active: selectedCondition === condition.value }"
                @click="selectCondition(condition.value)"
              >
                {{ condition.label }}
                <span class="item-count">({{ getConditionItemCount(condition.value) }})</span>
              </button>
            </div>
          </div>

          <!-- 商品列表 -->
          <div class="product-variants">
            <h3 class="variants-title">{{ $t('productDetail.availableItems') }}</h3>
            <div v-if="currentVariants.length === 0" class="no-variants">
              {{ $t('productDetail.noItems') }}
            </div>
            <div v-else class="variants-list">
              <div
                v-for="variant in currentVariants"
                :key="variant.id"
                class="variant-item"
                :class="{ selected: selectedVariant?.id === variant.id }"
                @click="selectVariant(variant)"
              >
                <div class="variant-info">
                  <span class="variant-condition">{{ getConditionLabel(variant.condition) }}</span>
                  <span class="variant-price">¥{{ variant.price.toFixed(2) }}</span>
                </div>
                <div class="variant-stock">
                  <span v-if="variant.stock > 0" class="in-stock">
                    {{ $t('productDetail.inStock') }} ({{ variant.stock }})
                  </span>
                  <span v-else class="out-of-stock">
                    {{ $t('productDetail.outOfStock') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions" v-if="selectedVariant">
            <button
              class="btn-add-cart"
              @click="addToCart"
              :disabled="selectedVariant.stock === 0"
            >
              {{ $t('productDetail.addToCart') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 下方：商品描述 -->
      <div class="product-description-section" v-if="selectedVariant">
        <h2 class="description-title">{{ $t('productDetail.description') }}</h2>
        <div class="description-content">
          <p>{{ selectedVariant.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { addToCart as addItemToCart } from '../utils/cart'
import { productApi } from '../utils/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 商品基本信息
const productId = computed(() => parseInt(route.params.id) || 1)
const productName = ref('')
const productImage = ref('')
const isLoading = ref(true)

// 成色类别
const conditions = [
  { value: '99', label: '99新' },
  { value: '85', label: '85新' },
  { value: '75', label: '75新' }
]

// 选中的成色
const selectedCondition = ref('99')

// 选中的商品变体
const selectedVariant = ref(null)

// 所有商品变体（从API加载）
const allVariants = ref([])

// 当前成色下的商品列表
const currentVariants = computed(() => {
  return allVariants.value.filter(v => v.condition === selectedCondition.value)
})

// 加载商品详情
const loadProductDetail = async () => {
  try {
    isLoading.value = true
    const data = await productApi.getProductDetail(productId.value)
    if (data) {
      productName.value = data.name
      productImage.value = data.image || generateProductImage()
      // 简化处理：将商品详情转换为变体列表
      allVariants.value = [
        {
          id: data.id,
          condition: '99',
          price: data.price,
          stock: data.stock,
          description: data.description || '商品描述'
        }
      ]
    }
  } catch (error) {
    console.error('加载商品详情失败:', error)
    // 使用默认假数据作为fallback
    productName.value = 'The Beatles - Abbey Road 黑胶唱片'
    productImage.value = generateProductImage()
    allVariants.value = [
      {
        id: 1,
        condition: '99',
        price: 299.00,
        stock: 3,
        description: '这张99新的Abbey Road黑胶唱片保存得非常好，几乎没有任何使用痕迹。封面完整，唱片表面光滑如新，音质完美。适合收藏家和追求完美音质的音乐爱好者。'
      },
      {
        id: 4,
        condition: '85',
        price: 199.00,
        stock: 5,
        description: '85新的Abbey Road，整体状态良好。封面有轻微使用痕迹，但整体完整。唱片有少量轻微划痕，但不影响播放，音质依然清晰。性价比很高。'
      },
      {
        id: 8,
        condition: '75',
        price: 129.00,
        stock: 6,
        description: '75新的Abbey Road，有明显的使用痕迹。封面有折痕和磨损，唱片表面有较多划痕，但依然可以正常播放。音质略有影响，但整体可听。适合预算有限的朋友。'
      }
    ]
  } finally {
    isLoading.value = false
  }
}

// 生成商品大图（使用唱片占位图）
const generateProductImage = () => {
  const svg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="500" height="500" fill="url(#grad)"/>
      <circle cx="250" cy="250" r="130" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
      <circle cx="250" cy="250" r="80" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <circle cx="250" cy="250" r="30" fill="rgba(255,255,255,0.4)"/>
      <text x="250" y="350" font-family="Arial, sans-serif" font-size="60" fill="rgba(255,255,255,0.8)" text-anchor="middle" font-weight="bold">💿</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;base64,${btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode('0x' + p1)))}`
}

// 选择成色
const selectCondition = (condition) => {
  selectedCondition.value = condition
  selectedVariant.value = null // 切换成色时清空选中的商品
}

// 选择商品变体
const selectVariant = (variant) => {
  selectedVariant.value = variant
}

// 获取成色标签
const getConditionLabel = (condition) => {
  const cond = conditions.find(c => c.value === condition)
  return cond ? cond.label : condition
}

// 获取某个成色下的商品数量
const getConditionItemCount = (condition) => {
  return allVariants.value.filter(v => v.condition === condition).length
}

// 添加到购物车
const addToCart = async () => {
  if (!selectedVariant.value) return

  const product = {
    id: selectedVariant.value.id,
    name: `${productName.value} - ${getConditionLabel(selectedVariant.value.condition)}`,
    image: productImage.value,
    price: selectedVariant.value.price
  }

  await addItemToCart(product, 1)
  // 触发Header更新
  window.dispatchEvent(new Event('cartUpdated'))

  alert('已添加到购物车')
}

onMounted(async () => {
  await loadProductDetail()
  // 默认选择第一个商品
  if (currentVariants.value.length > 0) {
    selectedVariant.value = currentVariants.value[0]
  }
})
</script>

<style scoped>
.product-detail-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xxl);
  margin-bottom: var(--spacing-xxl);
}

/* 左侧：商品大图 */
.product-image-section {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.main-image-wrapper {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-primary);
}

.main-image {
  width: 100%;
  height: auto;
  border-radius: var(--border-radius-md);
  display: block;
}

/* 右侧：商品信息 */
.product-info-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.product-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
  font-weight: bold;
}

/* 成色选择器 */
.condition-selector {
  margin-bottom: var(--spacing-xl);
}

.selector-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.condition-tabs {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.condition-tab {
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
  font-weight: 500;
}

.condition-tab:hover {
  border-color: var(--color-primary);
  background: var(--color-accent);
}

.condition-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.item-count {
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

/* 商品变体列表 */
.product-variants {
  margin-bottom: var(--spacing-xl);
}

.variants-title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: bold;
}

.no-variants {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.variants-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.variant-item {
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-bg);
}

.variant-item:hover {
  border-color: var(--color-primary);
  background: var(--color-accent);
  transform: translateX(4px);
}

.variant-item.selected {
  border-color: var(--color-primary);
  background: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.variant-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.variant-condition {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.variant-price {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  font-weight: bold;
}

.variant-stock {
  font-size: var(--font-size-sm);
}

.in-stock {
  color: var(--color-success);
}

.out-of-stock {
  color: var(--color-error);
}

/* 操作按钮 */
.product-actions {
  margin-top: var(--spacing-xl);
}

.btn-add-cart {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-add-cart:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-add-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 商品描述区域 */
.product-description-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border-top: 4px solid var(--color-primary);
}

.description-title {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: bold;
}

.description-content {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.8;
}

.description-content p {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .product-main {
    grid-template-columns: 1fr;
  }

  .product-image-section {
    position: static;
  }
}

@media (max-width: 767.98px) {
  .condition-tabs {
    flex-direction: column;
  }

  .condition-tab {
    width: 100%;
  }
}
</style>
