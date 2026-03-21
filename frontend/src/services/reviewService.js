// reviewService.js
import { getCurrentUser } from './authService'

// Fetch reviews for an album from backend API
export async function getAlbumReviews(albumId) {
  try {
    const response = await fetch(`/api/reviews/album/${albumId}`)
    
    if (response.ok) {
      const reviews = await response.json()
      // merchant_reply is already parsed by the backend, no need to parse again
      return reviews
    }
    return []
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return []
  }
}

// Check if user has reviewed a product
export async function hasUserReviewedProduct(productId) {
  const user = getCurrentUser()
  if (!user?.id) return false
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/reviews/user/product/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.hasReviewed
    }
    return false
  } catch (error) {
    console.error('Failed to check review status:', error)
    return false
  }
}

// Submit a new review
export async function addAlbumReview(payload) {
  const user = getCurrentUser()
  if (!user?.id) return { success: false, message: 'profile.notLoggedIn' }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: payload.product_id,
        rating: payload.rating,
        comment: payload.comment
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return { success: true, review: data.review }
    } else {
      return { success: false, message: data.error || 'review.submitFailed' }
    }
  } catch (error) {
    console.error('Failed to submit review:', error)
    return { success: false, message: 'review.submitFailed' }
  }
}