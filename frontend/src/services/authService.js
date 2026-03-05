// src/services/authService.js
import { apiCall } from './api'

export const login = async (username, password) => {
  try {
    const data = await apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    
    if (data.success) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      window.dispatchEvent(new Event('userStateChanged'))
      return { success: true, user: data.user }
    }
    return { success: false, message: data.message || 'Login failed' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'Network error' }
  }
}

export const register = async (userData) => {
  try {
    const data = await apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password
        // role is removed - backend will default to 'customer'
      })
    })
    
    if (data.success) {
      return { success: true, message: 'Registration successful' }
    }
    return { success: false, message: data.message || 'Registration failed' }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, message: 'Network error' }
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('currentUser')
  window.dispatchEvent(new Event('userStateChanged'))
  window.dispatchEvent(new Event('cartUpdated'))
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser')
  return userStr ? JSON.parse(userStr) : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}