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
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'reports' }"
          @click="activeTab = 'reports'"
        >
          {{ $t('seller.reportsTab') }}
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
            <span v-if="searchIdQuery && searchedProducts.length > 0" class="search-result-count">
              {{ $t('seller.searchResults', { count: searchedProducts.length }) }}
            </span>
            <span v-if="searchIdQuery && hasSearchedById && !isSearching && searchedProducts.length === 0" class="search-result-count error">
              {{ $t('seller.productNotFound') }}
            </span>
            <span v-if="searchIdQuery && isSearching" class="search-result-count">
              {{ $t('seller.searching') }}
            </span>
          </div>

          <!-- Display searched products by ID -->
          <div v-if="searchIdQuery && searchedProducts.length > 0" class="searched-products-list">
            <h4>{{ $t('seller.searchedProduct') }}</h4>
            <div v-for="product in searchedProducts" :key="product.product_id" class="searched-product-card">
              <div class="product-summary">
                <div class="summary-item">
                  <strong>{{ $t('seller.id') }}:</strong> {{ product.product_id || product.id }}
                </div>
                <div class="summary-item">
                  <strong>{{ $t('seller.album') }}:</strong> {{ product.album_title }}
                </div>
                <div class="summary-item">
                  <strong>{{ $t('seller.condition') }}:</strong> {{ formatProductCondition(product.condition) }}
                </div>
                <div class="summary-item">
                  <strong>{{ $t('seller.price') }}:</strong> ¥{{ product.price }}
                </div>
                <div class="summary-item">
                  <strong>{{ $t('seller.status') }}:</strong>
                  <span :class="product.is_active ? 'status-active' : 'status-inactive'">
                    {{ product.is_active ? $t('seller.active') : $t('seller.inactive') }}
                  </span>
                </div>
                <div class="summary-actions">
                  <button class="btn-secondary small" @click="editProduct(product)">
                    {{ $t('seller.edit') }}
                  </button>
                  <button
                    class="btn-small"
                    :class="product.is_active ? 'btn-warning' : 'btn-success'"
                    @click="toggleProductStatus(product)"
                  >
                    {{ product.is_active !== 1 ? $t('seller.activate') : $t('seller.deactivate') }}
                  </button>
                </div>
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
              <img
                :src="album.cover_image_url || getRecordPlaceholder(album.album_id)"
                :alt="album.title"
                class="album-cover"
                @error="(e) => (e.target.src = getRecordPlaceholder(album.album_id))"
              >
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
                    <h5>{{ formatProductCondition(product.condition) }}</h5>
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

        <div v-if="searchType === 'name' && searchQuery && filteredProductsByName.length > 0" class="products-section">
          <h4 class="products-title">Matched Products</h4>
          <div class="products-list">
            <div
              v-for="product in filteredProductsByName"
              :key="`search-${product.product_id || product.id}`"
              class="product-item"
            >
              <div class="product-details">
                <div class="product-id">ID: {{ product.product_id || product.id }}</div>
                <h5>{{ product.album_title }} · {{ formatProductCondition(product.condition) }}</h5>
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

      <!-- Reports Tab -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <h2 class="section-title">{{ $t('seller.reportsTab') }}</h2>

        <!-- Week Range Selector -->
        <div class="filter-section">
          <div class="filter-group">
            <label>{{ $t('seller.reports.weeks') }}</label>
            <select v-model="reports.weeks" @change="loadReports" class="filter-select">
              <option value="4">4 {{ $t('seller.reports.weeks') }}</option>
              <option value="8">8 {{ $t('seller.reports.weeks') }}</option>
              <option value="12">12 {{ $t('seller.reports.weeks') }}</option>
              <option value="24">24 {{ $t('seller.reports.weeks') }}</option>
              <option value="52">52 {{ $t('seller.reports.weeks') }}</option>
            </select>
          </div>
        </div>

        <!-- Weekly Comparison Card -->
        <div class="report-section weekly-comparison-card">
          <h3>{{ $t('seller.reports.weeklyComparison') }}</h3>
          <div v-if="reports.loading" class="loading">{{ $t('seller.loading') }}</div>
          <div v-else-if="reports.weeklyComparison.comparison" class="comparison-container">
            <!-- Current Week Stats -->
            <div class="comparison-block current-week">
              <div class="stat-row">
                <span class="stat-label">{{ $t('seller.reports.currentWeekTotalSales') }}</span>
                <span class="stat-value">{{ reports.weeklyComparison.comparison.current.units_sold }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">{{ $t('seller.reports.currentWeekTotalRevenue') }}</span>
                <span class="stat-value">¥{{ (reports.weeklyComparison.comparison.current.revenue || 0).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Comparison Indicators -->
            <div class="comparison-indicators">
              <div class="indicator-item" :class="getChangeClass(reports.weeklyComparison.comparison.unitsSoldChange)">
                <span class="indicator-label">{{ $t('seller.reports.salesChange') }}</span>
                <span class="indicator-value">
                  <span v-if="reports.weeklyComparison.comparison.unitsSoldChange > 0">+</span>
                  {{ reports.weeklyComparison.comparison.unitsSoldChange }}%
                  <span v-if="reports.weeklyComparison.comparison.unitsSoldChange > 0">↑</span>
                  <span v-else-if="reports.weeklyComparison.comparison.unitsSoldChange < 0">↓</span>
                </span>
              </div>
              <div class="indicator-item" :class="getChangeClass(reports.weeklyComparison.comparison.revenueChange)">
                <span class="indicator-label">{{ $t('seller.reports.revenueChange') }}</span>
                <span class="indicator-value">
                  <span v-if="reports.weeklyComparison.comparison.revenueChange > 0">+</span>
                  {{ reports.weeklyComparison.comparison.revenueChange }}%
                  <span v-if="reports.weeklyComparison.comparison.revenueChange > 0">↑</span>
                  <span v-else-if="reports.weeklyComparison.comparison.revenueChange < 0">↓</span>
                </span>
              </div>
            </div>

            <!-- Previous Week Stats (Optional Reference) -->
            <div class="comparison-block previous-week">
              <div class="stat-row small">
                <span class="stat-label">{{ $t('seller.reports.previousWeek') }}:</span>
                <span class="stat-value-small">
                  {{ reports.weeklyComparison.comparison.previous.units_sold }} {{ $t('seller.reports.units') }},
                  ¥{{ (reports.weeklyComparison.comparison.previous.revenue || 0).toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Genre Comparison Table -->
            <div v-if="reports.weeklyComparison.genreComparison && reports.weeklyComparison.genreComparison.length > 0" class="genre-comparison-section">
              <h4>{{ $t('seller.reports.genreComparison') }}</h4>
              <div class="genre-table-container">
                <table class="genre-comparison-table">
                  <thead>
                    <tr>
                      <th>{{ $t('seller.reports.genre') }}</th>
                      <th>{{ $t('seller.reports.currentWeekSales') }}</th>
                      <th>{{ $t('seller.reports.currentWeekRevenue') }}</th>
                      <th>{{ $t('seller.reports.salesChange') }}</th>
                      <th>{{ $t('seller.reports.revenueChange') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="genre in reports.weeklyComparison.genreComparison" :key="genre.genre_name">
                      <td class="genre-name">{{ genre.genre_name }}</td>
                      <td>{{ genre.current.units_sold }}</td>
                      <td>¥{{ genre.current.revenue.toFixed(2) }}</td>
                      <td :class="getChangeClass(genre.unitsSoldChange)">
                        <span v-if="genre.unitsSoldChange > 0">+</span>{{ genre.unitsSoldChange }}%
                      </td>
                      <td :class="getChangeClass(genre.revenueChange)">
                        <span v-if="genre.revenueChange > 0">+</span>{{ genre.revenueChange }}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Album Ranking Section -->
            <div v-if="reports.weeklyComparison.albumRanking &&
                      (reports.weeklyComparison.albumRanking.bestSelling.length > 0 ||
                       reports.weeklyComparison.albumRanking.worstSelling.length > 0)"
                 class="album-ranking-section">
              <div class="album-ranking-header">
                <h4>{{ $t('seller.reports.albumRanking') }}</h4>
                <select v-model="reports.weeklyComparison.albumSortType" class="ranking-sort-select">
                  <option value="bestWorst">{{ $t('seller.reports.bestAndWorst') }}</option>
                  <option value="allSorted">{{ $t('seller.reports.allSorted') }}</option>
                </select>
              </div>

              <div class="album-ranking-container">
                <!-- Best and Worst Selling Albums View -->
                <div v-if="reports.weeklyComparison.albumSortType === 'bestWorst'" class="ranking-columns">
                  <!-- Best Selling Albums -->
                  <div v-if="reports.weeklyComparison.albumRanking.bestSelling.length > 0" class="ranking-section best-selling">
                    <h5>{{ $t('seller.reports.bestSelling') }}</h5>
                    <div class="album-cards">
                      <div v-for="album in reports.weeklyComparison.albumRanking.bestSelling" :key="album.album_id" class="album-card">
                        <div class="album-cover">
                          <img :src="album.cover_image_url || getRecordPlaceholder(album.album_id)" :alt="album.title" @error="handleImageError">
                        </div>
                        <div class="album-info">
                          <div class="album-title">{{ album.title }}</div>
                          <div class="album-artist">{{ album.artist }}</div>
                          <div class="album-stats">
                            <span class="album-units">
                              <strong>{{ album.units_sold }}</strong> {{ $t('seller.reports.units') }}
                            </span>
                            <span class="album-revenue">¥{{ album.revenue.toFixed(2) }}</span>
                          </div>
                        </div>
                        <div class="album-rank">
                          <span class="rank-badge rank-1">#{{ reports.weeklyComparison.albumRanking.bestSelling.indexOf(album) + 1 }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Worst Selling Albums -->
                  <div v-if="reports.weeklyComparison.albumRanking.worstSelling.length > 0" class="ranking-section worst-selling">
                    <h5>{{ $t('seller.reports.worstSelling') }}</h5>
                    <div class="album-cards">
                      <div v-for="album in reports.weeklyComparison.albumRanking.worstSelling" :key="album.album_id" class="album-card">
                        <div class="album-cover">
                          <img :src="album.cover_image_url || getRecordPlaceholder(album.album_id)" :alt="album.title" @error="handleImageError">
                        </div>
                        <div class="album-info">
                          <div class="album-title">{{ album.title }}</div>
                          <div class="album-artist">{{ album.artist }}</div>
                          <div class="album-stats">
                            <span class="album-units">
                              <strong>{{ album.units_sold }}</strong> {{ $t('seller.reports.units') }}
                            </span>
                            <span class="album-revenue">¥{{ album.revenue.toFixed(2) }}</span>
                          </div>
                        </div>
                        <div class="album-rank">
                          <span class="rank-badge rank-low">↓#{{ reports.weeklyComparison.albumRanking.worstSelling.indexOf(album) + 1 }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- All Albums Sorted View -->
                <div v-if="reports.weeklyComparison.albumSortType === 'allSorted'" class="all-albums-table">
                  <table class="sorted-albums-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{{ $t('seller.reports.album') }}</th>
                        <th>{{ $t('seller.reports.artist') }}</th>
                        <th>{{ $t('seller.reports.sales') }}</th>
                        <th>{{ $t('seller.reports.revenue') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(album, index) in reports.weeklyComparison.albumRanking.allSorted" :key="album.album_id">
                        <td class="rank-cell">{{ index + 1 }}</td>
                        <td>{{ album.title }}</td>
                        <td>{{ album.artist }}</td>
                        <td>{{ album.units_sold }}</td>
                        <td>¥{{ album.revenue.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Product Condition Analysis Section -->
            <div v-if="reports.weeklyComparison.conditionAnalysis &&
                      (reports.weeklyComparison.conditionAnalysis.Mint ||
                       reports.weeklyComparison.conditionAnalysis['Near Mint'] ||
                       reports.weeklyComparison.conditionAnalysis['Good'])"
                 class="condition-analysis-section">
              <h4>{{ $t('seller.reports.conditionAnalysis') }}</h4>
              <div class="condition-cards">
                <div v-for="condition in conditionConditions" :key="condition" class="condition-card" :class="getBestConditionClass(condition)">
                  <div class="condition-header">
                    <span class="condition-label">{{ formatProductCondition(condition) }}</span>
                    <span class="condition-badge">{{ getBestConditionBadge(condition) }}</span>
                  </div>
                  <div class="condition-stats">
                    <div class="condition-stat">
                      <span class="stat-label">{{ $t('seller.reports.sales') }}:</span>
                      <span class="stat-value">{{ reports.weeklyComparison.conditionAnalysis[condition]?.units_sold || 0 }}</span>
                    </div>
                    <div class="condition-stat">
                      <span class="stat-label">{{ $t('seller.reports.revenue') }}:</span>
                      <span class="stat-value">¥{{ (reports.weeklyComparison.conditionAnalysis[condition]?.revenue || 0).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!reports.loading" class="no-data">{{ $t('seller.reports.noWeeklyComparisonData') }}</div>
        </div>

        <!-- Feature 1: Total Sales Trend -->
        <div class="report-section">
          <h3>{{ $t('seller.reports.totalTrend') }}</h3>
          <div v-if="reports.loading" class="loading">{{ $t('seller.loading') }}</div>
          <div v-else class="chart-container">
            <canvas ref="totalTrendChart" id="totalTrendChart"></canvas>
          </div>
          <div v-if="!reports.loading && reports.totalTrendData.length === 0" class="no-data">{{ $t('seller.reports.noData') }}</div>
        </div>

        <!-- Feature 2: Genre Weekly Comparison -->
        <div class="report-section">
          <h3>{{ $t('seller.reports.genreWeekly') }}</h3>
          <div v-if="reports.loading" class="loading">{{ $t('seller.loading') }}</div>
          <div v-else class="chart-container">
            <canvas ref="genreChart" id="genreChart"></canvas>
          </div>
          <div v-if="!reports.loading && reports.genreData.length === 0" class="no-data">{{ $t('seller.reports.noData') }}</div>
        </div>

        <!-- Feature 3: Album Selector & Trend -->
        <div class="report-section">
          <h3>{{ $t('seller.reports.albumTrend') }}</h3>
          <div class="filter-group" style="margin-bottom: 20px;">
            <label>{{ $t('seller.reports.selectAlbum') }}</label>
            <select v-model="reports.selectedAlbumId" @change="loadAlbumReports" class="filter-select">
              <option :value="null">{{ $t('seller.reports.allAlbums') }}</option>
              <option v-for="album in reports.albumsList" :key="album.album_id" :value="album.album_id">
                {{ album.title }} - {{ album.artist }}
              </option>
            </select>
          </div>
          <div v-if="reports.loading" class="loading">{{ $t('seller.loading') }}</div>
          <div v-else class="chart-container">
            <canvas ref="albumChart" id="albumChart"></canvas>
          </div>
          <div v-if="!reports.loading && reports.albumData.length === 0" class="no-data">{{ $t('seller.reports.noData') }}</div>
        </div>

        <!-- Feature 4: Product Sales Table -->
        <div class="report-section">
          <h3>{{ $t('seller.reports.productSales') }}</h3>
          <div v-if="reports.loading" class="loading">{{ $t('seller.loading') }}</div>
          <div v-else-if="reports.productData.length > 0" class="product-sales-table-wrap">
            <div class="product-sales-pagination">
              <span class="pagination-meta">
                {{ $t('seller.reports.productSalesRowsTotal', { count: reports.productData.length }) }}
              </span>
              <label class="pagination-page-size">
                <span>{{ $t('seller.reports.productSalesPerPage') }}</span>
                <select
                  v-model.number="reports.productSalesPageSize"
                  class="filter-select"
                  @change="resetProductSalesPagination"
                >
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </label>
              <span class="pagination-meta">
                {{
                  $t('seller.reports.productSalesPageInfo', {
                    current: reports.productSalesPage,
                    total: productSalesTotalPages
                  })
                }}
              </span>
              <div class="pagination-actions">
                <button
                  type="button"
                  class="btn-secondary small"
                  :disabled="reports.productSalesPage <= 1"
                  @click="goProductSalesPage(-1)"
                >
                  {{ $t('seller.reports.productSalesPrev') }}
                </button>
                <button
                  type="button"
                  class="btn-secondary small"
                  :disabled="reports.productSalesPage >= productSalesTotalPages"
                  @click="goProductSalesPage(1)"
                >
                  {{ $t('seller.reports.productSalesNext') }}
                </button>
              </div>
            </div>
            <div class="table-container">
              <table class="sales-table">
                <thead>
                  <tr>
                    <th>{{ $t('seller.reports.album') }}</th>
                    <th>{{ $t('seller.reports.condition') }}</th>
                    <th>{{ $t('seller.reports.price') }}</th>
                    <th>{{ $t('seller.reports.units') }}</th>
                    <th>{{ $t('seller.reports.revenue') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(product, idx) in paginatedProductSales"
                    :key="`${product.week ?? ''}-${product.product_id ?? idx}-${reports.productSalesPage}`"
                  >
                    <td>{{ product.album_title }}</td>
                    <td>{{ formatProductCondition(product.condition) }}</td>
                    <td>¥{{ (Number(product.price) || 0).toFixed(2) }}</td>
                    <td>{{ product.units_sold }}</td>
                    <td>¥{{ (Number(product.revenue) || 0).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="no-data">{{ $t('seller.reports.noData') }}</div>
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Chart from 'chart.js/auto'
import { getRecordPlaceholder } from '../utils/recordPlaceholder'
import { formatConditionLabel } from '../utils/conditionLabel'

const router = useRouter()
const { t } = useI18n()

const formatProductCondition = (c) => formatConditionLabel(t, c)

const productSalesPageSizeNum = computed(() => {
  const n = Number(reports.value.productSalesPageSize)
  return [10, 20, 50].includes(n) ? n : 20
})

const productSalesTotalPages = computed(() => {
  const len = reports.value.productData?.length || 0
  const size = productSalesPageSizeNum.value
  return Math.max(1, Math.ceil(len / size))
})

const paginatedProductSales = computed(() => {
  const list = reports.value.productData || []
  const size = productSalesPageSizeNum.value
  let page = Number(reports.value.productSalesPage) || 1
  const maxPage = productSalesTotalPages.value
  if (page > maxPage) page = maxPage
  if (page < 1) page = 1
  const start = (page - 1) * size
  return list.slice(start, start + size)
})

const goProductSalesPage = (delta) => {
  const next = (Number(reports.value.productSalesPage) || 1) + delta
  reports.value.productSalesPage = Math.min(Math.max(1, next), productSalesTotalPages.value)
}

const resetProductSalesPagination = () => {
  reports.value.productSalesPage = 1
}

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
const searchedProducts = ref([])
const isSearching = ref(false)
const hasSearchedById = ref(false)
const allProducts = ref([])

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

const filteredProductsByName = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []
  return allProducts.value.filter((product) => {
    const productId = String(product.product_id || product.id || '')
    const albumTitle = (product.album_title || '').toLowerCase()
    const condition = (product.condition || '').toLowerCase()
    return productId.includes(query) || albumTitle.includes(query) || condition.includes(query)
  }).slice(0, 20)
})

// Computed: Get condition conditions array
const conditionConditions = computed(() => {
  return ['Mint', 'Near Mint', 'Good']
})

// Helper: Get best/worst condition class
const getBestConditionClass = (condition) => {
  const conditions = reports.value.weeklyComparison.conditionAnalysis
  if (!conditions) return 'neutral'

  const unitsSold = {
    'Mint': conditions.Mint?.units_sold || 0,
    'Near Mint': conditions['Near Mint']?.units_sold || 0,
    'Good': conditions.Good?.units_sold || 0
  }

  const maxSales = Math.max(unitsSold['Mint'], unitsSold['Near Mint'], unitsSold['Good'])
  const minSales = Math.min(unitsSold['Mint'], unitsSold['Near Mint'], unitsSold['Good'])

  if (unitsSold[condition] === maxSales) return 'best'
  if (unitsSold[condition] === minSales) return 'worst'
  return 'neutral'
}

// Helper: Get best/worst condition badge
const getBestConditionBadge = (condition) => {
  const cls = getBestConditionClass(condition)
  if (cls === 'best') return '↑'
  if (cls === 'worst') return '↓'
  return ''
}

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

// Reports state
const reports = ref({
  weeks: 12,
  loading: false,
  totalTrendData: [],
  genreData: [],
  albumData: [],
  productData: [],
  productSalesPage: 1,
  productSalesPageSize: 20,
  selectedAlbumId: null,
  albumsList: [],
  weeklyComparison: {
    current: { units_sold: 0, revenue: 0 },
    previous: { units_sold: 0, revenue: 0 },
    comparison: {
      current: { units_sold: 0, revenue: 0 },
      previous: { units_sold: 0, revenue: 0 },
      unitsSoldChange: 0,
      revenueChange: 0
    },
    genreComparison: [],
    albumRanking: {
      bestSelling: [],
      worstSelling: [],
      allSorted: []
    },
    conditionAnalysis: {
      Mint: null,
      'Near Mint': null,
      'Good': null
    },
    albumSortType: 'bestWorst', // 'bestWorst' or 'allSorted'
    loading: false,
    error: null
  }
})

// Chart instances
let totalTrendChartInstance = null
let genreChartInstance = null
let albumChartInstance = null

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
  e.target.src = getRecordPlaceholder(1)
}

// Helper: Get CSS class for change indicator
const getChangeClass = (change) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
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

// Load reports data
const loadReports = async () => {
  console.log('Loading reports...')
  reports.value.loading = true
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // Load total trend data (Feature 1)
    console.log('Fetching total trend data...')
    const totalTrendRes = await fetch(`/api/seller/reports/total-trend?weeks=${reports.value.weeks}`, { headers })
    console.log('Total trend response status:', totalTrendRes.status)
    if (totalTrendRes.ok) {
      const data = await totalTrendRes.json()
      console.log('Total trend data:', data)
      reports.value.totalTrendData = data.data
    } else {
      console.error('Total trend API failed:', totalTrendRes.status)
    }

    // Load genre weekly data (Feature 2)
    console.log('Fetching genre data...')
    const genreRes = await fetch(`/api/seller/reports/genre-weekly?weeks=${reports.value.weeks}`, { headers })
    console.log('Genre response status:', genreRes.status)
    if (genreRes.ok) {
      const data = await genreRes.json()
      console.log('Genre data:', data)
      reports.value.genreData = data.data
    } else {
      console.error('Genre API failed:', genreRes.status)
    }

    // Load weekly comparison data
    console.log('Fetching weekly comparison data...')
    const comparisonRes = await fetch(`/api/seller/reports/weekly-comparison?weeks=${reports.value.weeks}`, { headers })
    console.log('Weekly comparison response status:', comparisonRes.status)
    if (comparisonRes.ok) {
      const data = await comparisonRes.json()
      console.log('Weekly comparison data:', data)
      reports.value.weeklyComparison.current = data.data.currentWeek
      reports.value.weeklyComparison.previous = data.data.previousWeek
      reports.value.weeklyComparison.comparison = data.data.comparison
      reports.value.weeklyComparison.genreComparison = data.data.genreComparison || []
      reports.value.weeklyComparison.albumRanking = data.data.albumRanking || { bestSelling: [], worstSelling: [], allSorted: [] }
      reports.value.weeklyComparison.conditionAnalysis = data.data.conditionAnalysis || { Mint: null, 'Near Mint': null, 'Good': null }
    } else {
      console.error('Weekly comparison API failed:', comparisonRes.status)
      const errorText = await comparisonRes.text()
      console.error('Error response:', errorText)
    }

    // Load albums list
    console.log('Fetching albums list...')
    const albumsRes = await fetch('/api/seller/reports/albums', { headers })
    console.log('Albums response status:', albumsRes.status)
    if (albumsRes.ok) {
      const data = await albumsRes.json()
      console.log('Albums list:', data)
      reports.value.albumsList = data.data
    } else {
      console.error('Albums API failed:', albumsRes.status)
    }

    // 专辑周趋势：含「所有专辑」汇总，需始终拉取/渲染
    await loadAlbumReports()

  } catch (error) {
    console.error('Failed to load reports:', error)
  } finally {
    reports.value.loading = false
    console.log('Reports loading complete')
    console.log('Loading state:', reports.value.loading)
    console.log('Canvases in DOM:', document.querySelectorAll('canvas'))

    // Wait for DOM to fully update after loading is false
    await nextTick()
    console.log('After nextTick, canvases:', document.querySelectorAll('canvas'))
    // Additional delay to ensure DOM is rendered
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('After delay, canvases:', document.querySelectorAll('canvas'))
    // Render charts after data is loaded（此时 canvas 已从 v-if 中挂载）
    await renderCharts()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await renderAlbumChart()
  }
}

// Load album specific reports (Feature 3 & 4)；selectedAlbumId 为空表示「所有专辑」周汇总
const loadAlbumReports = async () => {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const weeks = reports.value.weeks
    const albumId = reports.value.selectedAlbumId

    if (!albumId) {
      const [albumRes, productRes] = await Promise.all([
        fetch(`/api/seller/reports/album-weekly?weeks=${weeks}`, { headers }),
        fetch(`/api/seller/reports/product-weekly?weeks=${weeks}`, { headers })
      ])
      if (albumRes.ok) {
        const data = await albumRes.json()
        reports.value.albumData = data.data || []
      } else {
        reports.value.albumData = []
      }
      if (productRes.ok) {
        const data = await productRes.json()
        reports.value.productData = data.data || []
        resetProductSalesPagination()
      } else {
        reports.value.productData = []
        resetProductSalesPagination()
        console.error('Product weekly API failed:', productRes.status, await productRes.text().catch(() => ''))
      }
    } else {
      const albumRes = await fetch(`/api/seller/reports/album-weekly?weeks=${weeks}&album_id=${albumId}`, { headers })
      if (albumRes.ok) {
        const data = await albumRes.json()
        reports.value.albumData = data.data || []
      }

      const productRes = await fetch(`/api/seller/reports/product-weekly?weeks=${weeks}&album_id=${albumId}`, { headers })
      if (productRes.ok) {
        const data = await productRes.json()
        reports.value.productData = data.data || []
        resetProductSalesPagination()
      } else {
        reports.value.productData = []
        resetProductSalesPagination()
      }
    }

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    if (!reports.value.loading) {
      await renderAlbumChart()
    }
  } catch (error) {
    console.error('Failed to load album reports:', error)
  }
}

// Render all charts (total trend and genre only)
const renderCharts = async () => {
  console.log('Rendering all charts...')
  console.log('totalTrendData:', reports.value.totalTrendData)
  console.log('genreData:', reports.value.genreData)
  console.log('albumData:', reports.value.albumData)
  await renderTotalTrendChart()
  await renderGenreChart()
  // Note: Album chart is rendered separately in loadAlbumReports()
}

// Render total trend chart (Feature 1)
const renderTotalTrendChart = async () => {
  console.log('Rendering total trend chart...')
  console.log('DOM contains totalTrendChart?', document.getElementById('totalTrendChart'))
  const canvas = document.getElementById('totalTrendChart')
  if (!canvas) {
    console.log('Canvas not found for totalTrendChart')
    console.log('Available canvases:', document.querySelectorAll('canvas'))
    return
  }

  if (totalTrendChartInstance) {
    totalTrendChartInstance.destroy()
  }

  const data = reports.value.totalTrendData
  console.log('Total trend chart data:', data)

  const ctx = canvas.getContext('2d')

  // Handle empty data - render empty chart with no data message
  if (!data || data.length === 0) {
    console.log('No data to render total trend chart')
    totalTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: t('seller.reports.noData'),
            color: '#999'
          }
        }
      }
    })
    return
  }

  totalTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.week_start),
      datasets: [{
        label: t('seller.reports.units'),
        data: data.map(d => d.units_sold),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: t('seller.reports.revenue'),
        data: data.map(d => d.revenue),
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: t('seller.reports.units') }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: t('seller.reports.revenue') }
        }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}`
            }
          }
        }
      }
    }
  })
}

// Render genre weekly chart (Feature 2)
const renderGenreChart = async () => {
  console.log('Rendering genre chart...')
  const canvas = document.getElementById('genreChart')
  if (!canvas) {
    console.log('Canvas not found for genreChart')
    return
  }

  if (genreChartInstance) {
    genreChartInstance.destroy()
  }

  const data = reports.value.genreData
  console.log('Genre chart data:', data)

  const ctx = canvas.getContext('2d')

  // Color palette for genres
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']

  // Aggregate data by genre across all weeks (total units sold per genre)
  const genreTotals = new Map()
  data.forEach(d => {
    if (!genreTotals.has(d.genre)) {
      genreTotals.set(d.genre, 0)
    }
    genreTotals.set(d.genre, genreTotals.get(d.genre) + d.units_sold)
  })

  // Handle empty data - show pie chart with no data message
  if (!data || data.length === 0) {
    genreChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [t('seller.reports.noData')],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderColor: ['#e0e0e0'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: t('seller.reports.genreWeekly'),
            font: { size: 16 }
          }
        }
      }
    })
    return
  }

  genreChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Array.from(genreTotals.keys()),
      datasets: [{
        data: Array.from(genreTotals.values()),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: t('seller.reports.genreWeekly'),
          font: { size: 16 }
        }
      }
    }
  })
}

// Render album chart (Feature 3)
const renderAlbumChart = async () => {
  console.log('Rendering album chart...')
  const canvas = document.getElementById('albumChart')
  if (!canvas) {
    console.log('Canvas not found for albumChart')
    return
  }

  if (albumChartInstance) {
    albumChartInstance.destroy()
  }

  const data = reports.value.albumData
  console.log('Album chart data:', data)

  const ctx = canvas.getContext('2d')

  // Handle empty data - render empty chart with no data message
  if (!data || data.length === 0) {
    console.log('No data to render album chart')
    albumChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: t('seller.reports.noData'),
            color: '#999'
          }
        }
      }
    })
    return
  }

  const byWeekStart = new Map()
  for (const d of data) {
    const w = d.week_start
    if (w == null || w === '') continue
    if (!byWeekStart.has(w)) {
      byWeekStart.set(w, { units_sold: 0, revenue: 0 })
    }
    const agg = byWeekStart.get(w)
    agg.units_sold += Number(d.units_sold) || 0
    agg.revenue += Number(d.revenue) || 0
  }
  const labels = [...byWeekStart.keys()].sort()
  const unitsSeries = labels.map((w) => byWeekStart.get(w).units_sold)
  const revenueSeries = labels.map((w) => byWeekStart.get(w).revenue)

  albumChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: t('seller.reports.units'),
        data: unitsSeries,
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: t('seller.reports.revenue'),
        data: revenueSeries,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: t('seller.reports.units') }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: t('seller.reports.revenue') }
        }
      },
      plugins: {
        legend: { position: 'top' }
      }
    }
  })
}

// Watch for tab changes to load reports when switching to reports tab
watch(activeTab, async (newTab) => {
  console.log('Tab changed to:', newTab)
  if (newTab === 'reports') {
    // Wait for DOM to render the reports tab content
    await nextTick()
    // Additional delay to ensure DOM is fully rendered
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('DOM after delay, canvases:', document.querySelectorAll('canvas'))
    loadReports()
  }
})

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

    // Load products once for search visibility (includes product_id)
    const productsRes = await fetch('/api/seller/products', { headers })
    if (productsRes.ok) {
      const products = await productsRes.json()
      allProducts.value = products.map((p) => ({
        ...p,
        product_id: p.product_id || p.id,
        id: p.id || p.product_id
      }))
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
      const albumIdToRefresh = selectedAlbum.value?.album_id || productForm.value.album_id
      alert(editingProduct.value ? 'Product updated!' : 'Product added!')
      closeProductModal()
      
      // Reload products for this album
      if (albumIdToRefresh) await loadAlbumProducts(albumIdToRefresh)
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
    searchedProducts.value = []
    return
  }

  hasSearchedById.value = true
  isSearching.value = true
  searchedProducts.value = []

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
      searchedProducts.value = Array.isArray(data) ? data : []
    } else {
      console.error('Failed to search product by ID, status:', response.status)
      const errorText = await response.text()
      console.error('Response text:', errorText)
      searchedProducts.value = []
    }
  } catch (error) {
    console.error('Search product error:', error)
    searchedProducts.value = []
  } finally {
    isSearching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchIdQuery.value = ''
  searchedProducts.value = []
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

/* Reports Section Styles */
.report-section {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.report-section h3 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.chart-container {
  background: white;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  min-height: 400px;
  position: relative;
}

.product-sales-table-wrap {
  margin-top: var(--spacing-md);
}

.product-sales-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-light, #f5f6f8);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.product-sales-pagination .pagination-meta {
  color: var(--color-text-secondary);
}

.product-sales-pagination .pagination-page-size {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.product-sales-pagination .pagination-actions {
  display: inline-flex;
  gap: var(--spacing-sm);
  margin-left: auto;
}

.product-sales-pagination .btn-secondary.small {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.table-container {
  overflow-x: auto;
  margin-top: 0;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.sales-table thead {
  background: var(--color-primary);
  color: white;
}

.sales-table th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.sales-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-base);
}

.sales-table tbody tr:hover {
  background-color: var(--color-bg-light);
}

.sales-table tbody tr:last-child {
  border-bottom: none;
}

.sales-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.loading {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.no-data {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

/* Album Ranking Header with Sort Select */
.album-ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.album-ranking-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.ranking-sort-select {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.ranking-sort-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Album Ranking Columns */
.ranking-columns {
  display: flex;
  gap: 20px;
}

/* All Albums Sorted Table */
.all-albums-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.all-albums-table thead {
  background: #f5f5f5;
}

.all-albums-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
}

.all-albums-table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.all-albums-table tbody tr:hover {
  background: #f9f9f9;
}

.all-albums-table .rank-cell {
  font-weight: bold;
  color: #667eea;
  width: 50px;
}

/* Product Condition Analysis Section */
.condition-analysis-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.condition-analysis-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.condition-cards {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.condition-card {
  flex: 1;
  min-width: 200px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.condition-card.best {
  border-color: #4caf50;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
}

.condition-card.worst {
  border-color: #f44336;
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}

.condition-card.neutral {
  border-color: #e0e0e0;
  background: #f5f5f5;
}

.condition-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.condition-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.condition-badge {
  font-size: 18px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 50%;
  min-width: 32px;
  text-align: center;
}

.condition-card.best .condition-badge {
  color: #4caf50;
}

.condition-card.worst .condition-badge {
  color: #f44336;
}

.condition-card.neutral .condition-badge {
  color: #9e9e9e;
}

.condition-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.condition-stat .stat-label {
  color: #666;
}

.condition-stat .stat-value {
  font-weight: 600;
  color: #333;
  font-size: 16px;
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

/* Weekly Comparison Card Styles */
.weekly-comparison-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.comparison-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-block {
  padding: 15px;
  border-radius: 8px;
}

.comparison-block.current-week {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.comparison-block.previous-week {
  background: #f5f5f5;
  padding: 10px 15px;
}

.comparison-block .stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comparison-block .stat-row:last-child {
  margin-bottom: 0;
}

.comparison-block .stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.comparison-block .stat-value {
  font-size: 28px;
  font-weight: bold;
}

.comparison-block .stat-row.small {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.comparison-block .stat-value-small {
  font-size: 13px;
  color: #666;
}

.comparison-indicators {
  display: flex;
  gap: 15px;
}

.indicator-item {
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.indicator-item.positive {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.indicator-item.negative {
  background: #ffebee;
  border: 2px solid #f44336;
}

.indicator-item.neutral {
  background: #f5f5f5;
  border: 2px solid #9e9e9e;
}

.indicator-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.indicator-value {
  font-size: 24px;
  font-weight: bold;
}

.indicator-item.positive .indicator-value {
  color: #4caf50;
}

.indicator-item.negative .indicator-value {
  color: #f44336;
}

.indicator-item.neutral .indicator-value {
  color: #9e9e9e;
}

/* Genre Comparison Section */
.genre-comparison-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.genre-comparison-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.genre-table-container {
  overflow-x: auto;
}

.genre-comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.genre-comparison-table thead {
  background: #f5f5f5;
}

.genre-comparison-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
}

.genre-comparison-table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.genre-comparison-table tbody tr:hover {
  background: #f9f9f9;
}

.genre-comparison-table td.genre-name {
  font-weight: 500;
  color: #667eea;
}

.genre-comparison-table td.positive {
  color: #4caf50;
  font-weight: 500;
}

.genre-comparison-table td.negative {
  color: #f44336;
  font-weight: 500;
}

.genre-comparison-table td.neutral {
  color: #9e9e9e;
}

/* Album Ranking Section */
.album-ranking-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.album-ranking-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.album-ranking-container {
  display: flex;
  gap: 20px;
}

.ranking-section {
  flex: 1;
}

.ranking-section h5 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.ranking-section.best-selling h5 {
  color: #4caf50;
}

.ranking-section.worst-selling h5 {
  color: #f44336;
}

.album-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.album-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.album-card:hover {
  background: #f0f0f0;
  border-color: #ccc;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.album-cover {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #eee;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-info {
  flex: 1;
  min-width: 0;
}

.album-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-artist {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.album-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.album-units {
  font-size: 12px;
  color: #666;
}

.album-revenue {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.album-rank {
  flex-shrink: 0;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e0e0e0 100%);
  color: #333;
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #ffd700 100%);
  color: #fff;
}

.rank-low {
  background: #f5f5f5;
  color: #999;
  border: 1px solid #ddd;
}

/* Responsive Design for Weekly Comparison */
@media (max-width: 768px) {
  .comparison-indicators {
    flex-direction: column;
  }

  .comparison-block .stat-value {
    font-size: 22px;
  }

  .indicator-value {
    font-size: 20px;
  }
}
</style>