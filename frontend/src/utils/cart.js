// 购物车管理工具

// 获取购物车数据
export const getCart = () => {
  const cartStr = localStorage.getItem('cart')
  if (cartStr) {
    return JSON.parse(cartStr)
  }
  return []
}

// 保存购物车数据
export const saveCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart))
  // 触发自定义事件，通知其他组件更新
  window.dispatchEvent(new Event('cartUpdated'))
}

// 添加商品到购物车
export const addToCart = (product, quantity = 1) => {
  const cart = getCart()
  const existingItem = cart.find(item => item.id === product.id)
  
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price || 99.00, // 默认价格
      quantity: quantity
    })
  }
  
  saveCart(cart)
  return cart
}

// 更新商品数量
export const updateCartItemQuantity = (productId, quantity) => {
  const cart = getCart()
  const item = cart.find(item => item.id === productId)
  
  if (item) {
    if (quantity <= 0) {
      // 数量为0时删除商品
      return removeFromCart(productId)
    }
    item.quantity = quantity
    saveCart(cart)
  }
  
  return cart
}

// 从购物车删除商品
export const removeFromCart = (productId) => {
  const cart = getCart()
  const newCart = cart.filter(item => item.id !== productId)
  saveCart(newCart)
  return newCart
}

// 清空购物车
export const clearCart = () => {
  saveCart([])
}

// 获取购物车总数量
export const getCartCount = () => {
  const cart = getCart()
  return cart.reduce((total, item) => total + item.quantity, 0)
}

// 获取购物车总价
export const getCartTotal = () => {
  const cart = getCart()
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
}

// 初始化购物车（添加一些假数据用于测试）
export const initCartWithMockData = () => {
  const cart = getCart()
  if (cart.length === 0) {
    // 添加3个测试商品
    const mockProducts = [
      {
        id: 1,
        name: 'The Beatles - Abbey Road 黑胶唱片',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZGMyNjI2O3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojYjkxYzFjO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjZ3JhZDEpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjIwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNCkiLz48dGV4dCB4PSIxNTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5KvPC90ZXh0Pjwvc3ZnPg==',
        price: 199.00
      },
      {
        id: 2,
        name: 'Pink Floyd - The Dark Side of the Moon',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojYjkxYzFjO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOTkxYjFiO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjZ3JhZDIpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjIwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNCkiLz48dGV4dCB4PSIxNTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5KvPC90ZXh0Pjwvc3ZnPg==',
        price: 249.00
      },
      {
        id: 3,
        name: 'Led Zeppelin - IV 经典专辑',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQzIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOTkxYjFiO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojN2YxZDFkO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjZ3JhZDMpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjIwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNCkiLz48dGV4dCB4PSIxNTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5KvPC90ZXh0Pjwvc3ZnPg==',
        price: 179.00
      }
    ]
    
    mockProducts.forEach(product => {
      addToCart(product, 1)
    })
  }
}
