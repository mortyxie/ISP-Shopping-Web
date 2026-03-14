<template>
  <div class="addresses-page">
    <div class="container">
      <h1 class="page-title">{{ $t('address.title') }}</h1>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadAddresses" class="btn-primary">
          {{ $t('common.retry') }}
        </button>
      </div>

      <!-- Address List -->
      <div v-else>
        <!-- Add New Address Button -->
        <div class="addresses-header">
          <button class="btn-primary" @click="showAddressModal(null)">
            + {{ $t('address.addNew') }}
          </button>
        </div>

        <!-- Address Grid -->
        <div v-if="addresses.length === 0" class="empty-state">
          <div class="empty-icon">📍</div>
          <h2>{{ $t('address.noAddresses') }}</h2>
          <p>{{ $t('address.noAddressesDesc') }}</p>
        </div>

        <div v-else class="addresses-grid">
          <div
            v-for="address in addresses"
            :key="address.address_id"
            class="address-card"
            :class="{ 'default-address': address.is_default }"
          >
            <div class="address-card-header">
              <span class="address-recipient">{{ address.recipient_name }}</span>
              <span v-if="address.is_default" class="default-badge">{{ $t('address.default') }}</span>
            </div>

            <div class="address-details">
              <p class="address-phone">{{ address.phone }}</p>
              <p class="address-line">
                {{ address.address_line1 }}
                <span v-if="address.address_line2">, {{ address.address_line2 }}</span>
              </p>
              <p class="address-line">
                {{ address.city }}{{ address.state ? ', ' + address.state : '' }} {{ address.postal_code }}
              </p>
              <p class="address-country">{{ address.country }}</p>
            </div>

            <div class="address-actions">
              <button 
                v-if="!address.is_default" 
                class="btn-small btn-secondary"
                @click="setDefaultAddress(address)"
              >
                {{ $t('address.setDefault') }}
              </button>
              <button 
                class="btn-small btn-secondary"
                @click="showAddressModal(address)"
              >
                {{ $t('address.edit') }}
              </button>
              <button 
                class="btn-small btn-danger"
                @click="deleteAddress(address)"
              >
                {{ $t('address.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Address Modal (Add/Edit) -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>{{ editingAddress ? $t('address.edit') : $t('address.addNew') }}</h3>
        
        <form @submit.prevent="saveAddress" class="address-form">
          <div class="form-group">
            <label>{{ $t('address.form.recipientName') }} *</label>
            <input
              type="text"
              v-model="addressForm.recipient_name"
              :placeholder="$t('address.form.recipientNamePlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label>{{ $t('address.form.phone') }} *</label>
            <input
              type="tel"
              v-model="addressForm.phone"
              :placeholder="$t('address.form.phonePlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label>{{ $t('address.form.addressLine1') }} *</label>
            <input
              type="text"
              v-model="addressForm.address_line1"
              :placeholder="$t('address.form.addressLine1Placeholder')"
              required
            />
          </div>

          <div class="form-group">
            <label>{{ $t('address.form.addressLine2') }}</label>
            <input
              type="text"
              v-model="addressForm.address_line2"
              :placeholder="$t('address.form.addressLine2Placeholder')"
            />
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>{{ $t('address.form.city') }} *</label>
              <input
                type="text"
                v-model="addressForm.city"
                :placeholder="$t('address.form.cityPlaceholder')"
                required
              />
            </div>
            <div class="form-group half">
              <label>{{ $t('address.form.state') }}</label>
              <input
                type="text"
                v-model="addressForm.state"
                :placeholder="$t('address.form.statePlaceholder')"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>{{ $t('address.form.postalCode') }} *</label>
              <input
                type="text"
                v-model="addressForm.postal_code"
                :placeholder="$t('address.form.postalCodePlaceholder')"
                required
              />
            </div>
            <div class="form-group half">
              <label>{{ $t('address.form.country') }} *</label>
              <select v-model="addressForm.country" required>
                <option value="">{{ $t('address.form.selectCountry') }}</option>
                <option value="China">China</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Japan">Japan</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group checkbox">
            <label>
              <input type="checkbox" v-model="addressForm.is_default" />
              {{ $t('address.form.setAsDefault') }}
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              {{ $t('address.form.cancel') }}
            </button>
            <button type="submit" class="btn-primary">
              {{ editingAddress ? $t('address.form.update') : $t('address.form.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAuthenticated } from '../services/authService'

const router = useRouter()
const { t } = useI18n()

const addresses = ref([])
const isLoading = ref(true)
const error = ref(null)
const showModal = ref(false)
const editingAddress = ref(null)

const addressForm = ref({
  recipient_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  is_default: false
})

// Load addresses
const loadAddresses = async () => {
  isLoading.value = true
  error.value = null
  
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
    
    addresses.value = await response.json()
  } catch (err) {
    console.error('Failed to load addresses:', err)
    error.value = t('address.messages.error.loadFailed')
  } finally {
    isLoading.value = false
  }
}

// Show modal for add/edit
const showAddressModal = (address) => {
  if (address) {
    editingAddress.value = address
    addressForm.value = { ...address }
  } else {
    editingAddress.value = null
    addressForm.value = {
      recipient_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false
    }
  }
  showModal.value = true
}

// Close modal
const closeModal = () => {
  showModal.value = false
  editingAddress.value = null
}

// Save address
const saveAddress = async () => {
  // Validate required fields
  if (!addressForm.value.recipient_name || !addressForm.value.phone || 
      !addressForm.value.address_line1 || !addressForm.value.city || 
      !addressForm.value.postal_code || !addressForm.value.country) {
    alert(t('address.messages.error.required'))
    return
  }
  
  const token = localStorage.getItem('token')
  const url = editingAddress.value
    ? `/api/addresses/${editingAddress.value.address_id}`
    : '/api/addresses'
  
  const method = editingAddress.value ? 'PUT' : 'POST'
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressForm.value)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      closeModal()
      await loadAddresses()
      alert(editingAddress.value ? t('address.messages.updated') : t('address.messages.created'))
    } else {
      alert(data.error || t('address.messages.error.createFailed'))
    }
  } catch (err) {
    console.error('Error saving address:', err)
    alert(t('address.messages.error.createFailed'))
  }
}

// Set as default address
const setDefaultAddress = async (address) => {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`/api/addresses/${address.address_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...address,
        is_default: true
      })
    })
    
    if (response.ok) {
      await loadAddresses()
      alert(t('address.messages.defaultSet'))
    } else {
      const data = await response.json()
      alert(data.error || t('address.messages.error.updateFailed'))
    }
  } catch (err) {
    console.error('Error setting default address:', err)
    alert(t('address.messages.error.updateFailed'))
  }
}

// Delete address
const deleteAddress = async (address) => {
  if (!confirm(t('address.confirmDelete'))) return
  
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`/api/addresses/${address.address_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      await loadAddresses()
      alert(t('address.messages.deleted'))
    } else {
      const data = await response.json()
      alert(data.error || t('address.messages.error.deleteFailed'))
    }
  } catch (err) {
    console.error('Error deleting address:', err)
    alert(t('address.messages.error.deleteFailed'))
  }
}

// Check authentication
onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadAddresses()
})
</script>

<style scoped>
.addresses-page {
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
  text-align: center;
  margin-bottom: var(--spacing-xxl);
  font-weight: bold;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-xxxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-lg);
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

.addresses-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-xl);
}

.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.address-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-border);
  transition: all var(--transition-base);
}

.address-card.default-address {
  border-color: var(--color-primary);
  background: var(--color-bg-light);
}

.address-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.address-recipient {
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--color-text-primary);
}

.default-badge {
  background: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.address-details {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.address-phone {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.address-line {
  margin: var(--spacing-xs) 0;
}

.address-country {
  margin-top: var(--spacing-xs);
  font-style: italic;
}

.address-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}

.btn-small {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

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
  font-size: var(--font-size-xl);
}

.address-form {
  max-width: 100%;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--spacing-sm);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-base);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-weight: normal;
}

.form-group.checkbox input {
  width: auto;
}

.form-row {
  display: flex;
  gap: var(--spacing-md);
}

.form-group.half {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
}

@media (max-width: 768px) {
  .addresses-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>