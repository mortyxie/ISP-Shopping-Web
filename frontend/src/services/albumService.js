// src/services/albumService.js
import { apiCall } from './api'

/**
 * Get all albums with product counts
 * @returns {Promise<Array>} Array of albums with product counts
 */
export const getAlbums = async () => {
  try {
    const data = await apiCall('/albums')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch albums:', error)
    return []
  }
}

/**
 * Get single album by ID
 * @param {number} id - Album ID
 * @returns {Promise<Object>} Album data
 */
export const getAlbum = async (id) => {
  try {
    const data = await apiCall(`/albums/${id}`)
    return data
  } catch (error) {
    console.error(`Failed to fetch album ${id}:`, error)
    throw error
  }
}

/**
 * Get album with all its products
 * @param {number} id - Album ID
 * @returns {Promise<Object>} Album data with products array
 */
export const getAlbumWithProducts = async (id) => {
  try {
    const data = await apiCall(`/albums/${id}/with-products`)
    return data
  } catch (error) {
    console.error(`Failed to fetch album ${id} with products:`, error)
    throw error
  }
}

/**
 * Get products by album ID
 * @param {number} albumId - Album ID
 * @returns {Promise<Array>} Array of products
 */
export const getProductsByAlbum = async (albumId) => {
  try {
    const data = await apiCall(`/albums/${albumId}/products`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to fetch products for album ${albumId}:`, error)
    return []
  }
}

/**
 * Get featured albums (for homepage)
 * @param {number} limit - Number of albums to return
 * @returns {Promise<Array>} Array of featured albums
 */
export const getFeaturedAlbums = async (limit = 10) => {
  try {
    const data = await apiCall(`/albums/featured?limit=${limit}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch featured albums:', error)
    return []
  }
}

/**
 * Get albums by genre
 * @param {string} genre - Genre name
 * @returns {Promise<Array>} Array of albums in that genre
 */
export const getAlbumsByGenre = async (genre) => {
  try {
    const data = await apiCall(`/albums?genre=${encodeURIComponent(genre)}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to fetch albums for genre ${genre}:`, error)
    return []
  }
}

/**
 * Search albums by title or artist
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching albums
 */
export const searchAlbums = async (query) => {
  if (!query || query.length < 2) {
    return []
  }
  
  try {
    const data = await apiCall(`/albums/search?q=${encodeURIComponent(query)}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Failed to search albums for "${query}":`, error)
    return []
  }
}

/**
 * Get album statistics
 * @param {number} albumId - Album ID
 * @returns {Promise<Object>} Album statistics
 */
export const getAlbumStats = async (albumId) => {
  try {
    const data = await apiCall(`/albums/${albumId}/stats`)
    return data
  } catch (error) {
    console.error(`Failed to fetch stats for album ${albumId}:`, error)
    return {
      total_products: 0,
      min_price: 0,
      max_price: 0,
      avg_price: 0,
      conditions: {}
    }
  }
}

/**
 * Get new arrivals (recently added albums)
 * @param {number} limit - Number of albums to return
 * @returns {Promise<Array>} Array of new albums
 */
export const getNewArrivals = async (limit = 10) => {
  try {
    const data = await apiCall(`/albums/new?limit=${limit}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch new arrivals:', error)
    return []
  }
}

/**
 * Get album with price range
 * @param {number} albumId - Album ID
 * @returns {Promise<Object>} Album with min and max price
 */
export const getAlbumWithPriceRange = async (albumId) => {
  try {
    const data = await apiCall(`/albums/${albumId}/with-price-range`)
    return data
  } catch (error) {
    console.error(`Failed to fetch album ${albumId} with price range:`, error)
    throw error
  }
}