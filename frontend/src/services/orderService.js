// src/services/orderService.js
import { getCurrentUser } from './authService'

// Get purchase records for current user from backend API
export async function getPurchaseRecordsForCurrentUser() {
  const user = getCurrentUser()
  if (!user?.id) return []
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch orders')
      return []
    }
    
    const orders = await response.json()
    
    // Extract purchase records from orders
    const purchases = []
    for (const order of orders) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          purchases.push({
            order_id: order.id,
            purchased_at: order.paid_at || order.date,
            product_id: item.id,
            condition: item.condition,
            price_at_purchase: item.price,
            album_id: item.album_id,
            order_status: order.status
          })
        }
      }
    }
    
    return purchases
  } catch (error) {
    console.error('Failed to fetch purchase records:', error)
    return []
  }
}

// Get all orders for current user
export async function getOrdersForCurrentUser() {
  const user = getCurrentUser()
  if (!user?.id) return []
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return []
  }
}

// Get single order detail
export async function getOrderDetailForCurrentUser(orderId) {
  const user = getCurrentUser()
  if (!user?.id) return null
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
    return null
  }
}

// Create order from draft (for checkout)
export async function createOrderFromDraft(draft, options = {}) {
  const user = getCurrentUser()
  if (!user?.id) {
    return { success: false, message: '请先登录后再下单' }
  }

  const items = Array.isArray(draft?.items) ? draft.items : []
  if (items.length === 0) {
    return { success: false, message: '订单商品不能为空' }
  }

  const shipping_address = (draft?.shipping_address || '').trim()
  if (!shipping_address) {
    return { success: false, message: '请填写收件地址' }
  }

  const payment_method = draft?.payment_method
  if (!payment_method) {
    return { success: false, message: '请选择支付方式' }
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shipping_address,
        payment_method,
        items: items.map(item => ({
          product_id: item.product_id || item.id,
          price: item.price_at_purchase || item.price
        }))
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return { success: true, order: data }
    } else {
      return { success: false, message: data.error || '下单失败' }
    }
  } catch (error) {
    console.error('Failed to create order:', error)
    return { success: false, message: '网络错误，请重试' }
  }
}

// FIXED: Use sessionStorage with the correct key
export function setCheckoutDraft(draft) {
  console.log('Setting checkout draft:', draft)
  sessionStorage.setItem('checkout_draft', JSON.stringify(draft))
}

export function getCheckoutDraft() {
  try {
    const raw = sessionStorage.getItem('checkout_draft')
    console.log('Getting checkout draft:', raw)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearCheckoutDraft() {
  console.log('Clearing checkout draft')
  sessionStorage.removeItem('checkout_draft')
}