<template>
  <div class="seller-dashboard">
    <div class="container">
      <h1 class="page-title">{{ $t('seller.pageTitle') }}</h1>

      <!-- Tabs -->
      <div class="dashboard-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'albums' }"
          @click="activeTab = 'albums'"
        >
          {{ $t('seller.myAlbums') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'add-album' }"
          @click="activeTab = 'add-album'"
        >
          {{ $t('seller.addNewAlbum') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'orders' }"
          @click="activeTab = 'orders'"
        >
          {{ $t('seller.ordersTab') }}
        </button>
      </div>

      <!-- Albums List with Products Inside -->
      <div v-if="activeTab === 'albums'" class="tab-content">
        <h2 class="section-title">{{ $t('seller.myAlbums') }}</h2>

        <!-- Search Box -->
        <div class="search-section">
          <div class="search-type-toggle">
            <button
              @click="searchType = 'name'"
              :class="{ active: searchType === 'name' }"
              class="search-type-btn"
            >
              {{ $t('seller.searchByName') }}
            </button>
            <button
              @click="searchType = 'id'"
              :class="{ active: searchType === 'id' }"
              class="search-type-btn"
            >
              {{ $t('seller.searchById') }}
            </button>
          </div>

          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-if="searchType === 'id'"
              type="number"
              v-model="searchIdQuery"
              :placeholder="$t('seller.searchByIdPlaceholder')"
              class="search-input"
              @keydown.enter="handleSearchById"
            />
            <input
              v-else
              type="text"
              v-model="searchQuery"
              :placeholder="$t('seller.searchPlaceholder')"
              class="search-input"
            />
            <button
              v-if="searchIdQuery"
              @click="handleSearchById"
              class="search-go-btn"
              :disabled="isSearching"
            >
              {{ isSearching ? '...' : $t('seller.search') }}
            </button>
            <button
              v-if="searchQuery || searchIdQuery"
              @click="clearSearch"
              class="clear-search-btn"
            >
              ×
            </button>
          </div>
          <div class="search-info">
            <span v-if="searchQuery" class="search-result-count">
              {{ $t('seller.searchResults', { count: filteredAlbums.length }) }}
            </span>
            <span v-if="searchIdQuery && searchedProduct" class="search-result-count">
              {{ $t('seller.productFound') }}
            </span>
            <span v-if="searchIdQuery && hasSearchedById && !isSearching && !searchedProduct" class="search-result-count error">
              {{ $t('seller.productNotFound') }}
            </span>
            <span v-if="searchIdQuery && isSearching" class="search-result-count">
              {{ $t('seller.searching') }}
            </span>
          </div>

          <!-- Display searched product by ID -->
          <div v-if="searchIdQuery && searchedProduct" class="searched-product-card">
            <h4>{{ $t('seller.searchedProduct') }}</h4>
            <div class="product-summary">
              <div class="summary-item">
                <strong>{{ $t('seller.id') }}:</strong> {{ searchedProduct.product_id || searchedProduct.id }}
              </div>
              <div class="summary-item">
                <strong>{{ $t('seller.album') }}:</strong> {{ searchedProduct.album_title }}
              </div>
              <div class="summary-item">
                <strong>{{ $t('seller.condition') }}:</strong> {{ searchedProduct.condition }}
              </div>
              <div class="summary-item">
                <strong>{{ $t('seller.price') }}:</strong> ¥{{ searchedProduct.price }}
              </div>
              <div class="summary-item">
                <strong>{{ $t('seller.status') }}:</strong>
                <span :class="searchedProduct.is_active ? 'status-active' : 'status-inactive'">
                  {{ searchedProduct.is_active ? $t('seller.active') : $t('seller.inactive') }}
                </span>
              </div>
              <div class="summary-actions">
                <button class="btn-secondary small" @click="editProduct(searchedProduct)">
                  {{ $t('seller.edit') }}
                </button>
                <button
                  class="btn-small"
                  :class="searchedProduct.is_active ? 'btn-warning' : 'btn-success'"
                  @click="toggleProductStatus(searchedProduct)"
                >
                  {{ searchedProduct.is_active !== 1 ? $t('seller.activate') : $t('seller.deactivate') }}
                </button>
                <button
                  @click="clearSearch"
                  class="btn-secondary small"
                >
                  {{ $t('seller.close') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
        </div>

        <div v-else-if="filteredAlbums.length === 0 && searchType === 'name'" class="empty-state">
          <p v-if="searchQuery">{{ $t('seller.noSearchResults') }}</p>
          <p v-else>{{ $t('seller.noAlbumsYet') }}</p>
          <button v-if="!searchQuery" class="btn-primary" @click="activeTab = 'add-album'">
            {{ $t('seller.addFirstAlbum') }}
          </button>
        </div>

        <div v-else-if="searchType === 'name'" class="albums-container">
          <div v-for="album in filteredAlbums" :key="album.album_id" class="album-card">
            <!-- Album Header -->
            <div class="album-header">
              <img :src="album.cover_image_url" :alt="album.title" class="album-cover">
              <div class="album-info">
                <h3>{{ album.title }}</h3>
                <p>{{ album.artist }}</p>
                <p class="product-count">{{ $t('seller.productsCount', { count: album.product_count || 0 }) }}</p>
                <div class="album-actions">
                  <button class="btn-secondary" @click="editAlbum(album)">{{ $t('seller.editAlbumBtn') }}</button>
                  <button class="btn-primary" @click="addProduct(album)">{{ $t('seller.addProductBtn') }}</button>
                  <button class="btn-toggle" @click="toggleAlbumProducts(album.album_id)">
                    {{ expandedAlbums.includes(album.album_id) ? $t('seller.hideProducts') : $t('seller.showProducts') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Products List (expandable) -->
            <div v-if="expandedAlbums.includes(album.album_id)" class="products-section">
              <h4 class="products-title">{{ $t('seller.productsInAlbum') }}</h4>

              <div v-if="!albumProducts[album.album_id] || albumProducts[album.album_id].length === 0" class="no-products">
                <p>{{ $t('seller.noProductsInAlbum') }}</p>
              </div>

              <div v-else class="products-list">
                <div 
                  v-for="product in albumProducts[album.album_id]" 
                  :key="product.id" 
                  class="product-item"
                >
                  <div class="product-images">
                    <img 
                      v-for="(img, idx) in getProductImages(product).slice(0, 3)" 
                      :key="idx"
                      :src="img" 
                      class="product-thumb"
                      @error="handleImageError"
                    >
                    <span v-if="getProductImages(product).length > 3" class="more-images">
                      +{{ getProductImages(product).length - 3 }}
                    </span>
                  </div>
                  
                  <div class="product-details">
                    <div class="product-id">ID: {{ product.id || product.product_id }}</div>
                    <h5>{{ product.condition }}</h5>
                    <p class="product-price">¥{{ product.price }}</p>
                  </div>

                  <div class="product-actions">
                    <button class="btn-secondary small" @click="editProduct(product)">{{ $t('seller.edit') }}</button>
                    <button
                      class="btn-small"
                      :class="product.is_active ? 'btn-warning' : 'btn-success'"
                      @click="toggleProductStatus(product)"
                    >
                      {{ product.is_active !== 1 ? $t('seller.activate') : $t('seller.deactivate') }}
                    </button>
                    <button class="btn-danger small" @click="deleteProduct(product)">{{ $t('seller.deleteProduct') }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Album Form -->
      <div v-if="activeTab === 'add-album'" class="tab-content">
        <h2 class="section-title">{{ editingAlbum ? $t("seller.editAlbumTitle") : $t("seller.addAlbumTitle") }}</h2>
        
        <form @submit.prevent="saveAlbum" class="album-form">
          <div class="form-group">
            <label>{{ $t("seller.albumTitle") }}</label>
            <input 
              type="text" 
              v-model="albumForm.title" 
              required
              :placeholder="$t('seller.albumTitlePlaceholder')"
            >
          </div>

          <div class="form-group">
            <label>{{ $t("seller.artist") }}</label>
            <input 
              type="text" 
              v-model="albumForm.artist" 
              required
              :placeholder="$t('seller.artistPlaceholder')"
            >
          </div>

          <div class="form-group">
            <label>{{ $t("seller.genre") }}</label>
            <select v-model="albumForm.genre">
              <option value="">{{ $t("seller.selectGenre") }}</option>
              <option value="Rock">{{ $t("seller.rock") }}</option>
              <option value="Pop">{{ $t("seller.pop") }}</option>
              <option value="Jazz">{{ $t("seller.jazz") }}</option>
              <option value="Classical">{{ $t("seller.classical") }}</option>
              <option value="Electronic">{{ $t("seller.electronic") }}</option>
              <option value="Hip Hop">{{ $t("seller.hipHop") }}</option>
              <option value="Other">{{ $t("seller.other") }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ $t("seller.releaseYear") }}</label>
            <input 
              type="number" 
              v-model="albumForm.release_year"
              min="1900"
              :max="new Date().getFullYear()"
              :placeholder="$t('seller.releaseYearPlaceholder')"
            >
          </div>

          <div class="form-group">
            <label>{{ $t("seller.tracklist") }}</label>
            <textarea 
              v-model="albumForm.tracklist" 
              rows="4"
              placeholder="1. Come Together&#10;2. Something&#10;3. ..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>{{ $t("seller.albumCoverImage") }}</label>
            <div class="image-upload-area">
              <input 
                type="file" 
                accept="image/*"
                @change="handleAlbumImageUpload"
                ref="albumImageInput"
              >
              <div v-if="albumForm.cover_image" class="image-preview">
                <img :src="albumForm.cover_image" :alt="$t('seller.preview')">
                <button type="button" @click="removeAlbumImage" class="remove-image">×</button>
              </div>
              <p class="help-text">{{ $t("seller.uploadCoverRequired") }}</p>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="cancelAlbumForm">{{ $t("seller.cancel") }}</button>
            <button type="submit" class="btn-primary" :disabled="!albumForm.title || !albumForm.artist || !albumForm.cover_image">
              {{ editingAlbum ? $t("seller.updateAlbum") : $t("seller.createAlbum") }}
            </button>
          </div>
        </form>
      </div>

      <!-- Orders Tab with Filtering -->
      <div v-if="activeTab === 'orders'" class="tab-content">
        <h2 class="section-title">{{ $t("seller.ordersTab") }}</h2>
        
                <!-- Filter Controls -->
        <div class="filter-section">
          <div class="filter-group">
            <label>{{ $t('seller.orderFilter.status') }}</label>
            <select v-model="orderFilter.status" class="filter-select">
              <option value="all">{{ $t('seller.orderFilter.all') }}</option>
              <option value="pending">{{ $t('seller.orderFilter.pending') }}</option>
              <option value="paid">{{ $t('seller.orderFilter.paid') }}</option>
              <option value="shipped">{{ $t('seller.orderFilter.shipped') }}</option>
              <option value="completed">{{ $t('seller.orderFilter.completed') }}</option>
              <option value="cancelled">{{ $t('seller.orderFilter.cancelled') }}</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>{{ $t('seller.orderFilter.sortBy') }}</label>
            <select v-model="orderFilter.sortBy" class="filter-select">
              <option value="created_at">{{ $t('seller.orderFilter.date') }}</option>
              <option value="paid_at">{{ $t('seller.orderFilter.paymentDate') }}</option>
              <option value="shipped_at">{{ $t('seller.orderFilter.shippingDate') }}</option>
              <option value="completed_at">{{ $t('seller.orderFilter.completionDate') }}</option>
              <option value="total_amount">{{ $t('seller.orderFilter.total') }}</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>{{ $t('seller.orderFilter.order') }}</label>
            <select v-model="orderFilter.sortOrder" class="filter-select">
              <option value="desc">{{ $t('seller.orderFilter.newest') }}</option>
              <option value="asc">{{ $t('seller.orderFilter.oldest') }}</option>
            </select>
          </div>
        </div>

        <!-- Orders List -->
        <div class="orders-list">
          <div v-for="order in filteredOrders" :key="order.order_id" class="order-item">
            <div class="order-header">
              <div class="order-title">
                <span>{{ $t('seller.orderNumber') }}{{ order.order_id }}</span>
                <span class="order-date">{{ formatDate(order.created_at) }}</span>
              </div>
              <span class="order-status" :class="order.status">
                {{ getStatusText(order.status) }}
              </span>
            </div>
            
            <div class="order-details">
              <p><strong>{{ $t('seller.customer') }}</strong> {{ order.customer_name }}</p>
              <p><strong>{{ $t('seller.total') }}</strong> ¥{{ order.total_amount }}</p>
              <p><strong>{{ $t('seller.itemsLabel') }}</strong> {{ order.item_count }}</p>
              
              <!-- Status Timeline -->
              <div class="status-timeline">
                <div v-if="order.paid_at" class="timeline-item">
                  <span class="timeline-label">{{ $t('seller.timeline.paid') }}</span>
                  <span class="timeline-date">{{ formatDateTime(order.paid_at) }}</span>
                </div>
                <div v-if="order.shipped_at" class="timeline-item">
                  <span class="timeline-label">{{ $t('seller.timeline.shipped') }}</span>
                  <span class="timeline-date">{{ formatDateTime(order.shipped_at) }}</span>
                </div>
                <div v-if="order.completed_at" class="timeline-item">
                  <span class="timeline-label">{{ $t('seller.timeline.completed') }}</span>
                  <span class="timeline-date">{{ formatDateTime(order.completed_at) }}</span>
                </div>
                <div v-if="order.cancelled_at" class="timeline-item">
                  <span class="timeline-label">{{ $t('seller.timeline.cancelled') }}</span>
                  <span class="timeline-date">{{ formatDateTime(order.cancelled_at) }}</span>
                </div>
              </div>
            </div>
            
            <div class="order-actions">
              <button class="btn-secondary" @click="viewOrder(order)">
                {{ $t("seller.viewDetails") }}
              </button>
              
              <!-- Status Update Buttons for Seller -->
              <div class="status-actions">
                <button 
                  v-if="order.status === 'paid'"
                  class="btn-status shipped"
                  @click="updateOrderStatus(order, 'shipped')"
                >
                  {{ $t('seller.orderActions.markShipped') }}
                </button>
                <button 
                  v-if="order.status === 'shipped'"
                  class="btn-status completed"
                  @click="updateOrderStatus(order, 'completed')"
                >
                  {{ $t('seller.orderActions.markCompleted') }}
                </button>
                <button 
                  v-if="order.status === 'pending' || order.status === 'paid'"
                  class="btn-status cancelled"
                  @click="updateOrderStatus(order, 'cancelled')"
                >
                  {{ $t('seller.orderActions.cancel') }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="filteredOrders.length === 0" class="empty-orders">
            <p>{{ $t('seller.emptyOrders') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Product Modal -->
    <div v-if="showProductModal" class="modal">
      <div class="modal-content">
        <h3>{{ editingProduct ? $t("seller.editProductTitle") : $t("seller.addProductTitle") + (selectedAlbum?.title || "") }}</h3>
        
        <form @submit.prevent="saveProduct" class="product-form">
          <div class="form-group">
            <label>{{ $t("seller.conditionRequired") }}</label>
            <select v-model="productForm.condition" required>
              <option value="">{{ $t("seller.selectCondition") }}</option>
              <option value="Mint">{{ $t("seller.mint") }}</option>
              <option value="Near Mint">{{ $t("seller.nearMint") }}</option>
              <option value="Good">{{ $t("seller.good") }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ $t("seller.priceRequired") }}</label>
            <input
              type="number"
              v-model="productForm.price"
              step="0.01"
              min="0"
              required
              :placeholder="$t('seller.pricePlaceholder')"
            >
          </div>

          <div class="form-group">
            <label>{{ $t("seller.description") }}</label>
            <textarea
              v-model="productForm.description"
              rows="3"
              :placeholder="$t('seller.descriptionPlaceholder')"
            ></textarea>
          </div>

          <div class="form-group">
            <label>{{ $t("seller.productImages") }}</label>
            
            <!-- Image Grid -->
            <div class="images-grid">
              <div 
                v-for="(image, index) in productForm.images" 
                :key="index"
                class="image-item"
              >
                <img :src="image" :alt="`${$t('seller.productImage')} ${index + 1}`">
                <button 
                  type="button" 
                  @click="removeProductImage(index)" 
                  class="remove-image"
                  :title="$t('seller.removeImage')"
                >
                  ×
                </button>
              </div>
              
              <div 
                v-if="productForm.images.length < 5"
                class="image-upload-btn"
                @click="triggerProductImageUpload"
              >
                <input 
                  type="file" 
                  accept="image/*"
                  @change="handleProductImageUpload"
                  ref="productImageInput"
                  style="display: none"
                  multiple
                >
                <span>{{ $t("seller.addImage") }}</span>
              </div>
            </div>

            <p class="image-count">{{ productForm.images.length }}{{ $t("seller.imagesCount") }}</p>
            <p class="help-text" :class="{ 'text-danger': productForm.images.length < 3 }">
              {{ $t("seller.minImagesRequired") }}
            </p>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeProductModal">{{ $t("seller.cancel") }}</button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!productForm.condition || !productForm.price || productForm.images.length < 3"
            >
              {{ editingProduct ? $t("seller.updateProduct") : $t("seller.addProduct") }}
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

// State
const activeTab = ref('albums')
const isLoading = ref(false)
const albums = ref([])
const albumProducts = ref({})
const expandedAlbums = ref([])
const orders = ref([])
const searchQuery = ref('')
const searchIdQuery = ref('')
const searchType = ref('name')
const searchedProduct = ref(null)
const isSearching = ref(false)
const hasSearchedById = ref(false)

// Computed: Filter albums by search query
const filteredAlbums = computed(() => {
  if (!searchQuery.value.trim()) {
    return albums.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  // Filter albums whose title or artist matches
  return albums.value.filter(album => {
    const titleMatch = album.title?.toLowerCase().includes(query)
    const artistMatch = album.artist?.toLowerCase().includes(query)
    return titleMatch || artistMatch
  })
})

// Album form
const editingAlbum = ref(false)
const albumForm = ref({
  title: '',
  artist: '',
  genre: '',
  release_year: '',
  tracklist: '',
  cover_image: ''
})

// Product modal
const showProductModal = ref(false)
const editingProduct = ref(false)
const selectedAlbum = ref(null)
const productForm = ref({
  product_id: null,
  album_id: null,
  condition: '',
  price: '',
  description: '',
  images: []
})

// Order filter state - ADD THIS
const orderFilter = ref({
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc'
})

// Refs for file inputs
const albumImageInput = ref(null)
const productImageInput = ref(null)

// Helper: Safely get product images
const getProductImages = (product) => {
  if (!product) return []
  if (product.image_urls) {
    try {
      return typeof product.image_urls === 'string' 
        ? JSON.parse(product.image_urls) 
        : product.image_urls
    } catch {
      return []
    }
  }
  return []
}

// Helper: Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Helper: Handle image error
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/50?text=No+Image'
}

// Toggle album products visibility
const toggleAlbumProducts = (albumId) => {
  if (expandedAlbums.value.includes(albumId)) {
    expandedAlbums.value = expandedAlbums.value.filter(id => id !== albumId)
  } else {
    expandedAlbums.value.push(albumId)
    // Load products for this album if not already loaded
    if (!albumProducts.value[albumId]) {
      loadAlbumProducts(albumId)
    }
  }
}

// Load products for a specific album
const loadAlbumProducts = async (albumId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/albums/${albumId}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.ok) {
      const products = await response.json()
      console.log(`Products for album ${albumId}:`, products)
      
      // Map the response to include album_id
      const mappedProducts = products.map(p => ({
        ...p,
        product_id: p.id,
        album_id: albumId,
        image_urls: p.image_urls
      }))
      
      albumProducts.value[albumId] = mappedProducts
      
      // Update the album count
      const album = albums.value.find(a => a.album_id === albumId)
      if (album) {
        album.product_count = mappedProducts.length
      }
    }
  } catch (error) {
    console.error('Failed to load album products:', error)
  }
}

// Check if user is seller
onMounted(() => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  
  if (!token) {
    router.push('/login')
    return
  }
  
  if (user.role !== 'admin' && user.role !== 'seller') {
    router.push('/')
    return
  }
  
  loadSellerData()
})

// Load seller data
const loadSellerData = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    // Load albums
    const albumsRes = await fetch('/api/seller/albums', { headers })
    if (albumsRes.ok) {
      albums.value = await albumsRes.json()
      console.log('Albums loaded with product counts:', albums.value)
    }
    
    // Load orders
    const ordersRes = await fetch('/api/seller/orders', { headers })
    if (ordersRes.ok) {
      orders.value = await ordersRes.json()
    }
  } catch (error) {
    console.error('Failed to load seller data:', error)
  } finally {
    isLoading.value = false
  }
}

// Album image upload
const handleAlbumImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      albumForm.value.cover_image = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeAlbumImage = () => {
  albumForm.value.cover_image = ''
  if (albumImageInput.value) {
    albumImageInput.value.value = ''
  }
}

// Product image upload
const triggerProductImageUpload = () => {
  productImageInput.value.click()
}

const handleProductImageUpload = (e) => {
  const files = Array.from(e.target.files)
  const remainingSlots = 5 - productForm.value.images.length
  
  files.slice(0, remainingSlots).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      productForm.value.images.push(e.target.result)
    }
    reader.readAsDataURL(file)
  })
  
  productImageInput.value.value = ''
}

const removeProductImage = (index) => {
  if (confirm(t('seller.confirmRemoveImage'))) {
    productForm.value.images.splice(index, 1)
  }
}

// Album actions
const saveAlbum = async () => {
  try {
    const token = localStorage.getItem('token');
    const method = editingAlbum.value ? 'PUT' : 'POST';
    const url = editingAlbum.value 
      ? `/api/albums/${albumForm.value.album_id}` 
      : '/api/albums';
    
    // Prepare the data to send
    const albumData = {
      title: albumForm.value.title,
      artist: albumForm.value.artist,
      genre: albumForm.value.genre,
      release_year: albumForm.value.release_year,
      tracklist: albumForm.value.tracklist,
      cover_image: albumForm.value.cover_image  // Send the image data
    };
    
    console.log('Saving album data:', albumData);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(albumData)
    });
    
    if (response.ok) {
      alert(editingAlbum.value ? 'Album updated!' : 'Album created!');
      cancelAlbumForm();
      loadSellerData();
      activeTab.value = 'albums';
    } else {
      const error = await response.json().catch(() => ({ error: 'Failed to save album' }));
      alert('Error: ' + (error.error || 'Failed to save album'));
    }
  } catch (error) {
    console.error('Failed to save album:', error);
    alert('Failed to save album');
  }
};

const editAlbum = (album) => {
  console.log('Editing album:', album); // Debug log
  
  // Populate the form with existing album data
  albumForm.value = {
    album_id: album.album_id,
    title: album.title || '',
    artist: album.artist || '',
    genre: album.genre || '',
    release_year: album.release_year || '',
    tracklist: album.tracklist || '',
    cover_image: album.cover_image_url || ''  // This loads the existing cover image
  };
  
  editingAlbum.value = true;
  activeTab.value = 'add-album';
  
  console.log('Album form populated:', albumForm.value); // Debug log
};

//Cancel album
const cancelAlbumForm = () => {
  albumForm.value = {
    album_id: null,
    title: '',
    artist: '',
    genre: '',
    release_year: '',
    tracklist: '',
    cover_image: ''
  };
  editingAlbum.value = false;
  activeTab.value = 'albums';
  if (albumImageInput.value) {
    albumImageInput.value.value = '';
  }
};

// Product actions
const addProduct = (album) => {
  selectedAlbum.value = album
  productForm.value = {
    product_id: null,
    album_id: album.album_id,
    condition: '',
    price: '',
    description: '',
    images: []
  }
  editingProduct.value = false
  showProductModal.value = true
}

const editProduct = (product) => {
  console.log('Editing product:', product)
  
  // Find which album this product belongs to
  let albumId = product.album_id
  
  if (!albumId) {
    for (const aid in albumProducts.value) {
      const products = albumProducts.value[aid]
      if (products.some(p => p.id === product.id || p.product_id === product.id)) {
        albumId = parseInt(aid)
        break
      }
    }
  }
  
  const album = albums.value.find(a => a.album_id === albumId)
  selectedAlbum.value = album || { album_id: albumId, title: 'Unknown Album' }
  
  // Parse images
  let images = []
  if (product.image_urls) {
    try {
      images = typeof product.image_urls === 'string' 
        ? JSON.parse(product.image_urls) 
        : product.image_urls
    } catch (e) {
      console.error('Error parsing images:', e)
      images = []
    }
  }
  
  productForm.value = {
    product_id: product.id || product.product_id,
    album_id: albumId,
    condition: product.condition || '',
    price: product.price || '',
    description: product.description || '',
    images: images
  }
  
  console.log('Product form populated:', productForm.value)
  
  editingProduct.value = true
  showProductModal.value = true
}

const saveProduct = async () => {
  try {
    if (productForm.value.images.length < 3) {
      alert(t('seller.minImagesRequired'))
      return
    }
    
    const token = localStorage.getItem('token')
    const method = editingProduct.value ? 'PUT' : 'POST'
    const url = editingProduct.value 
      ? `/api/products/${productForm.value.product_id}` 
      : '/api/products'
    
    const productData = {
      album_id: productForm.value.album_id,
      condition: productForm.value.condition,
      price: parseFloat(productForm.value.price),
      description: productForm.value.description,
      images: productForm.value.images
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    })
    
    if (response.ok) {
      alert(editingProduct.value ? 'Product updated!' : 'Product added!')
      closeProductModal()
      
      // Reload products for this album
      if (selectedAlbum.value) {
        await loadAlbumProducts(selectedAlbum.value.album_id)
      }
    } else {
      const error = await response.json().catch(() => ({ error: 'Failed to save product' }))
      alert('Error: ' + (error.error || 'Failed to save product'))
    }
  } catch (error) {
    console.error('Failed to save product:', error)
    alert('Failed to save product: ' + error.message)
  }
}

const deleteProduct = async (product) => {
  const productId = product.id || product.product_id
  
  if (!productId) {
    alert('Error: Product ID not found')
    return
  }

  if (!confirm(t('seller.confirmDeleteProduct'))) return

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      alert('Product deleted successfully!')
      
      // Find and reload the album
      const albumId = product.album_id
      if (albumId) {
        await loadAlbumProducts(albumId)
      }
    } else {
      const error = await response.json().catch(() => ({ error: 'Failed to delete product' }))
      alert('Error: ' + (error.error || 'Failed to delete product'))
    }
  } catch (error) {
    console.error('Failed to delete product:', error)
    alert('Failed to delete product: ' + error.message)
  }
}

// Toggle product active status
const toggleProductStatus = async (product) => {
  // Default to true if is_active is undefined (for existing products)
  const currentStatus = product.is_active !== undefined ? product.is_active : true;
  const action = currentStatus ? 'deactivate' : 'activate';
  
  if (!confirm(t('seller.confirmToggleProduct', { action }))) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/products/${product.id}/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      alert(`Product ${action}d successfully!`);
      
      // Toggle the status locally
      product.is_active = !currentStatus;
      
      // Reload from server
      if (product.album_id) {
        await loadAlbumProducts(product.album_id);
      }
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'Failed to toggle status'));
    }
  } catch (error) {
    console.error('Failed to toggle product status:', error);
    alert('Failed to toggle product status');
  }
};

const closeProductModal = () => {
  showProductModal.value = false
  selectedAlbum.value = null
  productForm.value = {
    product_id: null,
    album_id: null,
    condition: '',
    price: '',
    description: '',
    images: []
  }
  editingProduct.value = false
  if (productImageInput.value) {
    productImageInput.value.value = ''
  }
}



const viewOrder = (order) => {
  // Navigate to order detail with a query param to indicate seller view
  router.push(`/order/${order.order_id}?seller=true`);
};

const handleSearchById = async () => {
  const productId = String(searchIdQuery.value || '').trim()
  console.log('handleSearchById called with productId:', productId)

  if (!productId) {
    searchedProduct.value = null
    return
  }

  hasSearchedById.value = true
  isSearching.value = true
  searchedProduct.value = null

  try {
    const token = localStorage.getItem('token')
    console.log('Token:', token ? 'exists' : 'not found')
    const url = `/api/seller/products/${productId}`
    console.log('Fetching from URL:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    if (response.ok) {
      const data = await response.json()
      console.log('Found product data:', data)
      searchedProduct.value = data
    } else if (response.status === 404) {
      console.log('Product not found (404)')
      searchedProduct.value = null
    } else {
      console.error('Failed to search product by ID, status:', response.status)
      const errorText = await response.text()
      console.error('Response text:', errorText)
      searchedProduct.value = null
    }
  } catch (error) {
    console.error('Search product error:', error)
    searchedProduct.value = null
  } finally {
    isSearching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchIdQuery.value = ''
  searchedProduct.value = null
  hasSearchedById.value = false
}

// Computed: Filter and sort orders - ADD THIS
const filteredOrders = computed(() => {
  let filtered = [...orders.value]
  
  // Apply status filter
  if (orderFilter.value.status !== 'all') {
    filtered = filtered.filter(order => order.status === orderFilter.value.status)
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aVal = a[orderFilter.value.sortBy]
    let bVal = b[orderFilter.value.sortBy]
    
    // Handle undefined values (put them at the end)
    if (aVal === undefined || aVal === null) aVal = orderFilter.value.sortOrder === 'desc' ? 0 : '9999-12-31'
    if (bVal === undefined || bVal === null) bVal = orderFilter.value.sortOrder === 'desc' ? 0 : '9999-12-31'
    
    if (orderFilter.value.sortOrder === 'desc') {
      return aVal > bVal ? -1 : 1
    } else {
      return aVal < bVal ? -1 : 1
    }
  })
  
  return filtered
})

// Update order status (for seller) - ADD THIS
const updateOrderStatus = async (order, newStatus) => {
  const confirmMessages = {
    shipped: t('seller.orderActions.markShipped') + '?',
    completed: t('seller.orderActions.markCompleted') + '?',
    cancelled: t('seller.orderActions.cancel') + '?'
  }
  
  if (!confirm(confirmMessages[newStatus])) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/seller/orders/${order.order_id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
    
    if (response.ok) {
      alert(t('seller.orderActions.mark' + newStatus.charAt(0).toUpperCase() + newStatus.slice(1)) + '!')
      await loadSellerData()
    } else {
      const error = await response.json()
      alert(t('common.error') + ': ' + (error.error || t('common.failed')))
    }
  } catch (error) {
    console.error('Failed to update order status:', error)
    alert(t('common.failed'))
  }
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': t('seller.orderStatus.pending'),
    'paid': t('seller.orderStatus.paid'),
    'shipped': t('seller.orderStatus.shipped'),
    'completed': t('seller.orderStatus.completed'),
    'cancelled': t('seller.orderStatus.cancelled')
  }
  return statusMap[status] || status
}

// Enhanced date formatting - ADD THIS
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

</script>

<style scoped>
.seller-dashboard {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
}

.dashboard-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.tab-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: none;
  font-size: var(--font-size-base);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
}

.tab-btn:hover {
  color: var(--color-primary);
  background-color: var(--color-accent);
}

.tab-btn.active {
  color: var(--color-primary);
  font-weight: bold;
  border-bottom: 3px solid var(--color-primary);
}

.tab-content {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

/* Search Section */
.search-section {
  margin-bottom: var(--spacing-xl);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-light);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  transition: border-color var(--transition-base);
}

.search-box:focus-within {
  border-color: var(--color-primary);
}

.search-icon {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-base);
  outline: none;
  color: var(--color-text-primary);
  padding: var(--spacing-xs) 0;
}

.search-input::placeholder {
  color: var(--color-text-secondary);
}

.clear-search-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.clear-search-btn:hover {
  background: var(--color-accent);
  color: var(--color-primary);
}

.search-info {
  margin-top: var(--spacing-sm);
}

.search-result-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.search-result-count.error {
  color: var(--color-error);
}

.search-go-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.search-go-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.search-go-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-type-toggle {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.search-type-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  color: var(--color-text-secondary);
}

.search-type-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.search-type-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.searched-product-card {
  background: var(--color-bg-light);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.searched-product-card h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-primary);
  font-size: var(--font-size-base);
}

.product-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-item {
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.summary-item strong {
  color: var(--color-text-primary);
  margin-right: var(--spacing-xs);
}

.status-active {
  color: var(--color-success);
  font-weight: bold;
}

.status-inactive {
  color: var(--color-error);
  font-weight: bold;
}

.summary-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.section-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xxl);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
}

/* Albums Container */
.albums-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.album-card {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.album-header {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.album-cover {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--border-radius-md);
}

.album-info {
  flex: 1;
}

.album-info h3 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
}

.album-info p {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-secondary);
}

.product-count {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: bold;
}

.album-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  flex-wrap: wrap;
}

.btn-toggle {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  color: var(--color-text-primary);
  transition: all var(--transition-base);
}

.btn-toggle:hover {
  background: var(--color-accent);
  border-color: var(--color-primary);
}

/* Products Section */
.products-section {
  padding: var(--spacing-lg);
  border-top: 2px solid var(--color-border);
  background: var(--color-bg);
}

.products-title {
  font-size: var(--font-size-base);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.product-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.product-images {
  display: flex;
  gap: 4px;
  min-width: 100px;
}

.product-thumb {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.more-images {
  width: 30px;
  height: 30px;
  background: var(--color-accent);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--color-text-secondary);
}

.product-details {
  flex: 1;
}

.product-id {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: monospace;
  background: var(--color-bg-light);
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
}

.product-details h5 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-primary);
  font-size: var(--font-size-base);
}

.product-price {
  font-size: var(--font-size-base);
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.product-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-secondary.small,
.btn-danger.small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.no-products {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

/* Forms */
.album-form,
.product-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-base);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.help-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.image-count {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: bold;
  margin-top: var(--spacing-xs);
}

/* Image Upload */
.image-upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  text-align: center;
  background: var(--color-bg-light);
}

.image-preview {
  position: relative;
  display: inline-block;
  margin-top: var(--spacing-md);
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--border-radius-md);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.image-item {
  position: relative;
  aspect-ratio: 1;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-error);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: transform var(--transition-base);
}

.remove-image:hover {
  transform: scale(1.1);
}

.image-upload-btn {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--color-bg-light);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--spacing-xs);
}

.image-upload-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}

.btn-primary,
.btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-item {
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.order-status {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: bold;
  text-transform: capitalize;
}

.order-status.pending {
  background: #fff3cd;
  color: #856404;
}

.order-status.paid {
  background: #d4edda;
  color: #155724;
}

.order-status.shipped {
  background: #cce5ff;
  color: #004085;
}

.order-status.completed {
  background: #d1e7dd;
  color: #0f5132;
}

.order-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--color-primary);
}

.btn-success {
  background: #27ae60;
  color: white;
  border: none;
}

.btn-success:hover {
  background: #2ecc71;
}

.btn-warning {
  background: #f39c12;
  color: white;
  border: none;
}

.btn-warning:hover {
  background: #e67e22;
}

.btn-small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

/* Filter Section - ADD THESE STYLES */
.filter-section {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-group label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.filter-select {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-bg);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Status Timeline - ADD THESE STYLES */
.status-timeline {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px dashed var(--color-border);
  font-size: var(--font-size-sm);
}

.timeline-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) 0;
}

.timeline-label {
  color: var(--color-text-secondary);
  min-width: 80px;
}

.timeline-date {
  color: var(--color-text-primary);
  font-family: monospace;
}

/* Status Action Buttons - ADD THESE STYLES */
.status-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  flex-wrap: wrap;
}

.btn-status {
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-status.shipped {
  background: #3498db;
  color: white;
}

.btn-status.shipped:hover {
  background: #2980b9;
}

.btn-status.completed {
  background: #27ae60;
  color: white;
}

.btn-status.completed:hover {
  background: #2ecc71;
}

.btn-status.cancelled {
  background: #e74c3c;
  color: white;
}

.btn-status.cancelled:hover {
  background: #c0392b;
}

.order-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.order-title {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.order-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.empty-orders {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

@media (max-width: 768px) {
  .dashboard-tabs {
    flex-wrap: wrap;
  }
  
  .album-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .album-actions {
    justify-content: center;
  }
  
  .product-item {
    flex-direction: column;
    text-align: center;
  }
  
  .product-images {
    justify-content: center;
  }
  
  .product-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .order-details {
    grid-template-columns: 1fr;
  }
}
</style>