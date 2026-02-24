# 在线购物平台 API 文档

## 目录

- [基础信息](#基础信息)
- [认证机制](#认证机制)
- [用户模块](#用户模块)
- [首页模块](#首页模块)
- [商品详情模块](#商品详情模块)
- [购物车模块](#购物车模块)
- [订单模块](#订单模块)
- [评论模块](#评论模块)
- [评论泡泡模块](#评论泡泡模块)
- [卖主商品管理模块](#卖主商品管理模块)
- [销售报告模块](#销售报告模块)
- [错误码说明](#错误码说明)
- [前端集成示例](#前端集成示例)

---

## 基础信息

### Base URL

```
开发环境: http://localhost:3000/api
生产环境: https://your-domain.com/api
```

### 通用请求头

```http
Content-Type: application/json
Accept: application/json
```

### 认证说明

需要认证的接口需要在请求头中携带Token：

```http
Authorization: Bearer <token>
```

---

## 认证机制

### 用户登录

成功登录后会返回JWT Token，后续请求需要携带该Token进行身份验证。

**Token有效期**: 7天

**Token刷新**: Token过期后需要重新登录获取新Token

---

## 用户模块

### 1. 用户登录

**接口地址**: `POST /user/login`

**是否需要认证**: 否

**请求参数**:

```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "123456789",
    "username": "testuser",
    "role": "user"
  }
}
```

---

### 2. 用户注册

**接口地址**: `POST /user/register`

**是否需要认证**: 否

**请求参数**:

```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，4-20字符 |
| password | string | 是 | 密码，至少8位，需包含字母和数字 |
| email | string | 是 | 邮箱地址 |

**响应示例**:

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "userId": "123456789",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

---

### 3. 用户登出

**接口地址**: `POST /user/logout/:user_id`

**是否需要认证**: 否

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| user_id | string | 用户ID |

**响应示例**:

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 首页模块

### 1. 获取所有商品

**接口地址**: `GET /`

**是否需要认证**: 否

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10，最大100 |
| sort | string | 否 | 排序字段，默认createdAt |
| order | string | 否 | 排序方向：asc/desc，默认desc |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "商品名称",
        "price": 99.99,
        "description": "商品描述",
        "image": "https://example.com/image.jpg",
        "category": "电子产品",
        "stock": 100,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

### 2. 搜索商品

**接口地址**: `GET /search`

**是否需要认证**: 否

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## 商品详情模块

### 1. 获取商品详情

**接口地址**: `GET /product/:product_id`

**是否需要认证**: 否

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| product_id | string | 商品ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "商品名称",
    "price": 99.99,
    "description": "商品详细描述",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "category": "电子产品",
    "stock": 100,
    "sold": 50,
    "rating": 4.5,
    "reviewCount": 20,
    "attributes": {
      "brand": "品牌",
      "model": "型号",
      "color": "颜色"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 获取商品评论

**接口地址**: `GET /product/:product_id/reviews`

**是否需要认证**: 否

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| product_id | string | 商品ID |

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "123456789",
        "username": "买家1",
        "rating": 5,
        "comment": "商品很好，推荐购买！",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

---

### 3. 获取商品评分

**接口地址**: `GET /product/:product_id/rating`

**是否需要认证**: 否

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| product_id | string | 商品ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 20,
    "ratingDistribution": {
      "5": 12,
      "4": 5,
      "3": 2,
      "2": 1,
      "1": 0
    }
  }
}
```

---

## 购物车模块

> **注意**: 购物车模块所有接口都需要用户登录

### 1. 获取购物车商品

**接口地址**: `GET /cart/:cart_item_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| cart_item_id | string | 购物车ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "cartId": "507f1f77bcf86cd799439013",
    "userId": "123456789",
    "items": [
      {
        "cartItemId": "507f1f77bcf86cd799439014",
        "productId": "507f1f77bcf86cd799439011",
        "name": "商品名称",
        "price": 99.99,
        "quantity": 2,
        "image": "https://example.com/image.jpg",
        "subtotal": 199.98
      }
    ],
    "total": 199.98,
    "totalItems": 2
  }
}
```

---

### 2. 更改商品数量

**接口地址**: `PUT /cart/:cart_item_id/:product_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| cart_item_id | string | 购物车ID |
| product_id | string | 商品ID |

**请求参数**:

```json
{
  "quantity": 3
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| quantity | number | 是 | 新的数量，必须大于0 |

**响应示例**:

```json
{
  "success": true,
  "message": "数量更新成功",
  "data": {
    "quantity": 3,
    "subtotal": 299.97
  }
}
```

---

### 3. 删除购物车商品

**接口地址**: `DELETE /cart/:cart_item_id/:product_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| cart_item_id | string | 购物车ID |
| product_id | string | 商品ID |

**响应示例**:

```json
{
  "success": true,
  "message": "商品已从购物车移除"
}
```

---

### 4. 清空购物车

**接口地址**: `DELETE /cart/:cart_item_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| cart_item_id | string | 购物车ID |

**响应示例**:

```json
{
  "success": true,
  "message": "购物车已清空"
}
```

---

### 5. 结账（创建订单）

**接口地址**: `POST /cart/order`

**是否需要认证**: 是

**请求参数**:

```json
{
  "shippingAddress": {
    "name": "张三",
    "phone": "13800138000",
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区",
    "address": "某某街道123号",
    "postalCode": "100000"
  },
  "paymentMethod": "alipay",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "couponId": null
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| shippingAddress | object | 是 | 收货地址 |
| shippingAddress.name | string | 是 | 收货人姓名 |
| shippingAddress.phone | string | 是 | 联系电话 |
| shippingAddress.province | string | 是 | 省 |
| shippingAddress.city | string | 是 | 市 |
| shippingAddress.district | string | 是 | 区 |
| shippingAddress.address | string | 是 | 详细地址 |
| shippingAddress.postalCode | string | 是 | 邮政编码 |
| paymentMethod | string | 是 | 支付方式：alipay/wechat/card |
| items | array | 是 | 订单商品列表 |
| items[].productId | string | 是 | 商品ID |
| items[].quantity | number | 是 | 购买数量 |
| couponId | string | 否 | 优惠券ID |

**响应示例**:

```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderId": "ORD20240115001",
    "userId": "123456789",
    "items": [...],
    "totalAmount": 199.98,
    "discountAmount": 0,
    "finalAmount": 199.98,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 订单模块

> **注意**: 订单模块所有接口都需要用户登录

### 1. 获取订单列表

**接口地址**: `GET /order/order`

**是否需要认证**: 是

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| status | string | 否 | 订单状态筛选 |

**订单状态**:
| 状态 | 说明 |
|------|------|
| pending | 待付款 |
| paid | 已付款 |
| shipped | 已发货 |
| delivered | 已送达 |
| completed | 已完成 |
| cancelled | 已取消 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ORD20240115001",
        "userId": "123456789",
        "items": [
          {
            "productId": "507f1f77bcf86cd799439011",
            "name": "商品名称",
            "price": 99.99,
            "quantity": 2,
            "subtotal": 199.98
          }
        ],
        "totalAmount": 199.98,
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 2. 获取订单详情

**接口地址**: `GET /order/order/:order_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| order_id | string | 订单ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "orderId": "ORD20240115001",
    "userId": "123456789",
    "items": [...],
    "shippingAddress": {
      "name": "张三",
      "phone": "13800138000",
      "province": "北京市",
      "city": "北京市",
      "district": "朝阳区",
      "address": "某某街道123号",
      "postalCode": "100000"
    },
    "totalAmount": 199.98,
    "paymentMethod": "alipay",
    "status": "pending",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "note": "订单创建"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 评论模块

> **注意**: 评论模块所有接口都需要用户登录

### 1. 获取可评价的商品

**接口地址**: `GET /review/:order_id/:order_item_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| order_id | string | 订单ID |
| order_item_id | string | 订单项ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "orderItem": {
      "orderItemId": "507f1f77bcf86cd799439015",
      "orderId": "ORD20240115001",
      "productId": "507f1f77bcf86cd799439011",
      "name": "商品名称",
      "image": "https://example.com/image.jpg",
      "quantity": 2,
      "price": 99.99,
      "canReview": true,
      "orderStatus": "completed"
    }
  }
}
```

---

### 2. 发布评论

**接口地址**: `POST /review/review/:product_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| product_id | string | 商品ID |

**请求参数**:

```json
{
  "rating": 5,
  "comment": "商品很好，推荐购买！",
  "images": [
    "https://example.com/review1.jpg",
    "https://example.com/review2.jpg"
  ],
  "orderId": "ORD20240115001"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rating | number | 是 | 评分，1-5之间的整数 |
| comment | string | 是 | 评论内容，10-500字符 |
| images | array | 否 | 评论图片，最多9张 |
| orderId | string | 是 | 关联的订单ID |

**响应示例**:

```json
{
  "success": true,
  "message": "评论发布成功",
  "data": {
    "reviewId": "507f1f77bcf86cd799439016",
    "userId": "123456789",
    "productId": "507f1f77bcf86cd799439011",
    "rating": 5,
    "comment": "商品很好，推荐购买！",
    "images": [...],
    "createdAt": "2024-01-20T15:30:00.000Z"
  }
}
```

---

## 评论泡泡模块

### 1. 随机展示评论泡泡

**接口地址**: `GET /bubble/bubble`

**是否需要认证**: 否

**响应示例**:

```json
{
  "success": true,
  "data": {
    "bubbles": [
      {
        "bubbleId": "507f1f77bcf86cd799439017",
        "userId": "123456789",
        "username": "用户1",
        "content": "买了这个商品，质量不错！",
        "productId": "507f1f77bcf86cd799439011",
        "productName": "商品名称",
        "productImage": "https://example.com/image.jpg",
        "createdAt": "2024-01-18T08:00:00.000Z"
      },
      {
        "bubbleId": "507f1f77bcf86cd799439018",
        "userId": "987654321",
        "username": "用户2",
        "content": "发货很快，包装完好",
        "productId": "507f1f77bcf86cd799439022",
        "productName": "商品B",
        "productImage": "https://example.com/image2.jpg",
        "createdAt": "2024-01-18T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 2. 发布评论泡泡

**接口地址**: `POST /bubble/bubble/:user_id`

**是否需要认证**: 是

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| user_id | string | 用户ID |

**请求参数**:

```json
{
  "content": "买了这个商品，质量不错！",
  "productId": "507f1f77bcf86cd799439011"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 泡泡内容，5-100字符 |
| productId | string | 是 | 关联的商品ID |

**响应示例**:

```json
{
  "success": true,
  "message": "评论泡泡发布成功",
  "data": {
    "bubbleId": "507f1f77bcf86cd799439019",
    "userId": "123456789",
    "username": "testuser",
    "content": "买了这个商品，质量不错！",
    "productId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

## 卖主商品管理模块

> **注意**: 卖主商品管理模块所有接口都需要卖主权限

### 1. 获取所有商品

**接口地址**: `GET /manager/album`

**是否需要认证**: 是（卖主权限）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| status | string | 否 | 商品状态：active/inactive |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "商品名称",
        "price": 99.99,
        "stock": 100,
        "sold": 50,
        "status": "active",
        "category": "电子产品",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-10T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

---

### 2. 发布新商品

**接口地址**: `POST /manager/newalbum`

**是否需要认证**: 是（卖主权限）

**请求参数**:

```json
{
  "name": "新商品名称",
  "description": "商品详细描述",
  "price": 99.99,
  "category": "电子产品",
  "stock": 100,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "attributes": {
    "brand": "品牌",
    "model": "型号",
    "color": "黑色"
  },
  "tags": ["新品", "热卖"]
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 商品名称，2-100字符 |
| description | string | 是 | 商品描述，10-1000字符 |
| price | number | 是 | 价格，大于0 |
| category | string | 是 | 商品分类 |
| stock | number | 是 | 库存数量，必须大于0 |
| images | array | 是 | 商品图片，至少1张，最多10张 |
| attributes | object | 否 | 商品属性 |
| tags | array | 否 | 商品标签 |

**响应示例**:

```json
{
  "success": true,
  "message": "商品发布成功",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "新商品名称",
    "price": 99.99,
    "stock": 100,
    "status": "active",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

### 3. 下架商品

**接口地址**: `DELETE /manager/album/:album_id`

**是否需要认证**: 是（卖主权限）

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| album_id | string | 商品ID |

**响应示例**:

```json
{
  "success": true,
  "message": "商品已下架"
}
```

---

### 4. 更新商品

**接口地址**: `POST /manager/album/:album_id`

**是否需要认证**: 是（卖主权限）

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| album_id | string | 商品ID |

**请求参数**:

```json
{
  "name": "更新后的商品名称",
  "description": "更新后的商品描述",
  "price": 89.99,
  "stock": 80,
  "images": [
    "https://example.com/newimage1.jpg"
  ],
  "status": "active"
}
```

**字段说明**: 与发布商品相同，所有字段都是可选的

**响应示例**:

```json
{
  "success": true,
  "message": "商品更新成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "更新后的商品名称",
    "price": 89.99,
    "stock": 80,
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

---

## 销售报告模块

> **注意**: 销售报告模块需要卖主权限

### 1. 获取销售总额

**接口地址**: `GET /report/report`

**是否需要认证**: 是（卖主权限）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD |
| period | string | 否 | 时间周期：daily/weekly/monthly，默认daily |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "totalSales": 15000.00,
    "totalOrders": 50,
    "averageOrderValue": 300.00,
    "topProducts": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "热卖商品A",
        "sales": 5000.00,
        "quantity": 50
      }
    ],
    "salesByPeriod": [
      {
        "date": "2024-01-15",
        "sales": 2500.00,
        "orders": 8
      },
      {
        "date": "2024-01-16",
        "sales": 3200.00,
        "orders": 10
      }
    ]
  }
}
```

---

## 错误码说明

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 无内容（如预检请求） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源未找到 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_TOKEN | 无效的令牌 |
| TOKEN_EXPIRED | 令牌已过期 |
| VALIDATION_ERROR | 数据验证失败 |
| NOT_FOUND | 资源未找到 |
| UNAUTHORIZED | 未授权访问 |
| FORBIDDEN | 禁止访问 |
| DUPLICATE_KEY | 数据重复 |
| INSUFFICIENT_STOCK | 库存不足 |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "字段名",
      "message": "具体错误信息"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1234567890"
}
```

---

## 前端集成示例

### 1. 使用Axios配置API客户端

```javascript
// api/client.js
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token过期，跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 权限不足
          console.error('权限不足');
          break;
        case 404:
          // 资源未找到
          console.error('资源未找到');
          break;
        case 429:
          // 请求过于频繁
          console.error('请求过于频繁，请稍后再试');
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败:', error.response.data.message);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 2. 用户登录示例

```javascript
// api/auth.js
import apiClient from './client';

export const authAPI = {
  // 用户登录
  login: async (username, password) => {
    const response = await apiClient.post('/user/login', {
      username,
      password,
    });
    // 保存Token到localStorage
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  // 用户注册
  register: async (username, password, email) => {
    const response = await apiClient.post('/user/register', {
      username,
      password,
      email,
    });
    return response.data;
  },

  // 用户登出
  logout: async (userId) => {
    const response = await apiClient.post(`/user/logout/${userId}`);
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    return response.data;
  },
};
```

---

### 3. 商品API示例

```javascript
// api/product.js
import apiClient from './client';

export const productAPI = {
  // 获取所有商品
  getAllProducts: async (params = {}) => {
    const { page = 1, limit = 10, sort, order } = params;
    const response = await apiClient.get('/', {
      params: { page, limit, sort, order },
    });
    return response.data;
  },

  // 搜索商品
  searchProducts: async (keyword, params = {}) => {
    const { page = 1, limit = 10 } = params;
    const response = await apiClient.get('/search', {
      params: { keyword, page, limit },
    });
    return response.data;
  },

  // 获取商品详情
  getProductDetail: async (productId) => {
    const response = await apiClient.get(`/product/${productId}`);
    return response.data;
  },

  // 获取商品评论
  getProductReviews: async (productId, params = {}) => {
    const { page = 1, limit = 10 } = params;
    const response = await apiClient.get(`/product/${productId}/reviews`, {
      params: { page, limit },
    });
    return response.data;
  },

  // 获取商品评分
  getProductRating: async (productId) => {
    const response = await apiClient.get(`/product/${productId}/rating`);
    return response.data;
  },
};
```

---

### 4. 购物车API示例

```javascript
// api/cart.js
import apiClient from './client';

export const cartAPI = {
  // 获取购物车
  getCart: async (cartId) => {
    const response = await apiClient.get(`/cart/${cartId}`);
    return response.data;
  },

  // 添加商品到购物车
  addToCart: async (productId, quantity = 1) => {
    const response = await apiClient.post(`/cart/${cartId}`, {
      productId,
      quantity,
    });
    return response.data;
  },

  // 更新商品数量
  updateQuantity: async (cartId, productId, quantity) => {
    const response = await apiClient.put(`/cart/${cartId}/${productId}`, {
      quantity,
    });
    return response.data;
  },

  // 删除购物车商品
  removeItem: async (cartId, productId) => {
    const response = await apiClient.delete(`/cart/${cartId}/${productId}`);
    return response.data;
  },

  // 清空购物车
  clearCart: async (cartId) => {
    const response = await apiClient.delete(`/cart/${cartId}`);
    return response.data;
  },

  // 结账
  checkout: async (orderData) => {
    const response = await apiClient.post('/cart/order', orderData);
    return response.data;
  },
};
```

---

### 5. React Hook示例

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储的用户信息
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const result = await authAPI.login(username, password);
    if (result.success) {
      setUser(result.data);
    }
    return result;
  };

  const logout = async () => {
    if (user) {
      await authAPI.logout(user.userId);
      setUser(null);
    }
  };

  const register = async (username, password, email) => {
    return await authAPI.register(username, password, email);
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
};
```

---

### 6. Vue3 Composition API示例

```javascript
// composables/useAuth.js
import { ref, computed } from 'vue';
import { authAPI } from '@/api/auth';

export function useAuth() {
  const user = ref(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);

  const initAuth = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      user.value = JSON.parse(userInfo);
    }
    loading.value = false;
  };

  const login = async (username, password) => {
    const result = await authAPI.login(username, password);
    if (result.success) {
      user.value = result.data;
    }
    return result;
  };

  const logout = async () => {
    if (user.value) {
      await authAPI.logout(user.value.userId);
      user.value = null;
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    initAuth,
  };
}
```

---

## 请求频率限制

为了保护系统稳定性和安全性，API有以下请求频率限制：

| 接口类型 | 限制 | 时间窗口 |
|----------|------|----------|
| 普通请求 | 100次 | 15分钟 |
| 登录请求 | 5次 | 15分钟 |
| 注册请求 | 3次 | 1小时 |
| 评论请求 | 10次 | 15分钟 |

超过限制会返回 `429 Too Many Requests` 状态码。

---

## 注意事项

1. **Token管理**: Token有效期为7天，过期后需要重新登录获取新Token
2. **参数验证**: 所有接口都会对请求参数进行验证，请确保参数格式正确
3. **错误处理**: 所有接口都可能返回错误，前端需要做好错误处理
4. **图片上传**: 图片URL建议使用CDN服务或对象存储
5. **分页参数**: 支持分页的接口，page从1开始，limit最大值为100
6. **时间格式**: 所有时间字段使用ISO 8601格式
7. **ID格式**: 使用MongoDB ObjectId格式，24位十六进制字符串

---

## 联系方式

如有API相关问题，请联系开发团队。

前端集成快速开始

 1. 配置API客户端
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

 2. 添加Token到请求头
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 3. 调用API
const response = await api.get('/');  // 获取所有商品
const loginRes = await api.post('/user/login', { username, password });
