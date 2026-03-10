import { getCurrentUser } from './authService'

const STORAGE_KEY = 'mock_order_db_v1'
const CHECKOUT_DRAFT_KEY = 'mock_checkout_draft_v1'

function nowIso() {
  return new Date().toISOString()
}

function readDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { orders: [], orderItems: [] }
    const parsed = JSON.parse(raw)
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      orderItems: Array.isArray(parsed.orderItems) ? parsed.orderItems : []
    }
  } catch {
    return { orders: [], orderItems: [] }
  }
}

function writeDb(db) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      orders: db.orders || [],
      orderItems: db.orderItems || []
    })
  )
}

function nextId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

export function setCheckoutDraft(draft) {
  localStorage.setItem(
    CHECKOUT_DRAFT_KEY,
    JSON.stringify({
      ...draft,
      created_at: nowIso()
    })
  )
}

export function getCheckoutDraft() {
  try {
    const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearCheckoutDraft() {
  localStorage.removeItem(CHECKOUT_DRAFT_KEY)
}

export function createOrderFromDraft(draft, options = {}) {
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
  const allowedPayments = ['支付宝', '微信', 'Mpay']
  if (!allowedPayments.includes(payment_method)) {
    return { success: false, message: '请选择支付方式' }
  }

  const db = readDb()
  const order_id = nextId('order')
  const created_at = nowIso()
  const paid_at = options.markPaid === false ? null : created_at

  const normalizedItems = items.map((it) => {
    const price = Number.isFinite(Number(it.price_at_purchase))
      ? Number(it.price_at_purchase)
      : Number(it.price || 0)

    return {
      order_item_id: nextId('order_item'),
      order_id,
      product_id: it.product_id ?? it.productId ?? it.id,
      price_at_purchase: price,
      // 孤品：每个商品只能购买 1 件
      quantity: 1,
      name: it.name,
      artist: it.artist,
      image: it.image,
      condition: it.condition
    }
  })

  const total_amount = normalizedItems.reduce(
    (sum, it) => sum + Number(it.price_at_purchase || 0) * Number(it.quantity || 1),
    0
  )

  const order = {
    order_id,
    user_id: user.id,
    total_amount: Math.round(total_amount * 100) / 100,
    status: options.status || 'paid',
    shipping_address,
    payment_method,
    transaction_id: options.transaction_id || nextId('txn'),
    paid_at,
    created_at
  }

  db.orders.unshift(order)
  db.orderItems.unshift(...normalizedItems)
  writeDb(db)

  return { success: true, order }
}

export function getOrdersForCurrentUser() {
  const user = getCurrentUser()
  if (!user?.id) return []
  const db = readDb()
  return db.orders.filter((o) => o.user_id === user.id)
}

export function getOrderDetailForCurrentUser(orderId) {
  const user = getCurrentUser()
  if (!user?.id) return null
  const db = readDb()
  const order = db.orders.find((o) => o.order_id === orderId && o.user_id === user.id)
  if (!order) return null
  const items = db.orderItems.filter((it) => it.order_id === order.order_id)
  return { order, items }
}

