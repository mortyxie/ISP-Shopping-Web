// src/services/cartService.js
import { apiCall } from './api'
import { isAuthenticated } from './authService'

// Get cart items
export const getCart = async () => {
  const token = localStorage.getItem('token')
  if (!token) return []
  
  try {
    const response = await fetch('/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const items = await response.json()
      // Ensure each item has all needed fields
      return items.map(item => ({
        id: item.id,
        name: item.name,
        artist: item.artist || '',
        image: item.image,
        condition: item.condition,
        price: item.price,
        is_active: item.is_active
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to fetch cart:', error)
    return []
  }
}

// Add to cart
export const addToCart = async (productId) => {
  if (!isAuthenticated()) {
    window.location.href = '/login'
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    const response = await apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    })
    
    if (response && response.success) {
      window.dispatchEvent(new Event('cartUpdated'))
      return { success: true }
    }
    
    // Return specific error message from server
    return { success: false, error: response.error || 'Failed to add to cart' }
  } catch (error) {
    console.error('Add to cart error:', error)
    return { success: false, error: error.message }
  }
}

// Remove from cart
export const removeFromCart = async (productId) => {
  if (!isAuthenticated()) return
  
  try {
    await apiCall(`/cart/remove/${productId}`, {
      method: 'DELETE'
    })
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (error) {
    console.error('Failed to remove from cart:', error)
    throw error
  }
}

// Clear cart
export const clearCart = async () => {
  if (!isAuthenticated()) return
  
  try {
    await apiCall('/cart/clear', {
      method: 'DELETE'
    })
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (error) {
    console.error('Failed to clear cart:', error)
    throw error
  }
}

// Get cart summary (count only, no total needed but keeping for compatibility)
export const getCartSummary = async () => {
  if (!isAuthenticated()) {
    return { count: 0 }
  }
  
  try {
    const cart = await getCart()
    return { count: cart.length }
  } catch (error) {
    console.error('Failed to get cart summary:', error)
    return { count: 0 }
  }
}