# 前端说明

## 如何安装依赖与运行

在项目根目录执行以下命令：

```
cd frontend
npm install
npm run dev
```

如需构建：

```
npm run build
```

如需预览构建产物：

```
npm run preview
```

## 假数据使用清单

**⚠️ 重要：以下所有假数据都需要在API开发完成后替换为真实接口调用**

### 用户认证相关

**文件位置**：`src/utils/auth.js`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| `MOCK_USERS` | 假账户数据（3个测试账户） | `POST /api/auth/login` | 包含user1、user2、seller三个测试账号 |
| `login()` 函数 | 登录验证逻辑 | `POST /api/auth/login` | 当前使用假数据验证，需替换为API调用 |
| `getCartCount()` | 购物车数量获取 | `GET /api/cart/count` | 当前从localStorage读取，需替换为API |

**测试账户**：
- `user1` / `123456` - 普通用户（张三）
- `user2` / `123456` - 普通用户（李四）
- `seller` / `123456` - 商家账号

### 购物车相关

**文件位置**：`src/utils/cart.js`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| `getCart()` | 获取购物车数据 | `GET /api/cart` | 当前从localStorage读取 |
| `saveCart()` | 保存购物车数据 | `POST /api/cart` 或 `PUT /api/cart` | 当前保存到localStorage |
| `addToCart()` | 添加商品到购物车 | `POST /api/cart/add` | 需替换为API调用 |
| `updateCartItemQuantity()` | 更新商品数量 | `PUT /api/cart/item/:id` | 需替换为API调用 |
| `removeFromCart()` | 删除商品 | `DELETE /api/cart/item/:id` | 需替换为API调用 |
| `getCartTotal()` | 获取购物车总价 | 可由API返回或前端计算 | 当前前端计算 |
| `initCartWithMockData()` | 初始化测试数据 | 仅用于开发测试 | 开发完成后可删除 |

### 主页（Home.vue）

**文件位置**：`src/views/Home.vue`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| `forumData` | 论坛最新动态（10条） | `GET /api/forum/latest?limit=10` | 主页右侧展示的论坛数据 |
| `products` | 精选商品列表（30个） | `GET /api/products/featured?limit=30` | 主页商品展示 |
| `getRecordPlaceholder()` | 商品图片占位图生成 | `GET /api/products/:id/image` | 当前使用SVG生成，需替换为真实图片URL |

### 商品详情页（ProductDetail.vue）

**文件位置**：`src/views/ProductDetail.vue`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| `productName` | 商品名称 | `GET /api/products/:id` | 当前硬编码，需从API获取 |
| `productImage` | 商品大图 | `GET /api/products/:id/image` | 当前使用SVG生成，需替换为真实图片 |
| `allVariants` | 商品变体列表（12个） | `GET /api/products/:id/variants` | 包含不同成色（99新、85新、75新）的商品变体 |
| 商品变体数据 | 每个变体的价格、库存、描述 | `GET /api/products/:id/variants` | 当前包含12个假数据变体 |

### 论坛页面（Forum.vue）

**文件位置**：`src/views/Forum.vue`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| `initialBubbles` | 初始论坛气泡数据（10条） | `GET /api/forum/posts?limit=10` | 页面加载时显示的论坛留言 |
| `handleSubmit()` | 发布新留言 | `POST /api/forum/posts` | 当前仅添加到本地数组，需替换为API调用 |

### 分类页面（Category.vue）

**文件位置**：`src/views/Category.vue`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| `categories` | 商品分类列表（12个分类） | `GET /api/categories` | 当前硬编码12个分类，需从API获取 |
| 分类商品数量 | 每个分类下的商品数量 | `GET /api/categories/:id/count` | 当前使用假数据（count字段） |

### 搜索页面（Search.vue）

**文件位置**：`src/views/Search.vue`

| 数据项 | 说明 | 预计替换的接口 | 备注 |
| --- | --- | --- | --- |
| 搜索功能 | 商品搜索 | `GET /api/products/search?keyword=xxx` | 当前为占位符页面，需实现搜索逻辑 |

### 其他页面

以下页面当前为占位符，需要实现并接入API：

- **注册页面** (`Register.vue`) - `POST /api/auth/register`
- **忘记密码** (`ForgotPassword.vue`) - `POST /api/auth/forgot-password`
- **个人中心** (`Profile.vue`) - `GET /api/user/profile`
- **商家端** (`SellerDashboard.vue`) - `GET /api/seller/dashboard`
- **我的订单** (`Orders.vue`) - `GET /api/orders`
- **订单详情** (`OrderDetail.vue`) - `GET /api/orders/:id`
- **我的收藏** (`Wishlist.vue`) - `GET /api/wishlist`
- **结算/支付** (`Checkout.vue`) - `POST /api/orders/checkout`
- **商品评价** (`Review.vue`) - `GET /api/products/:id/reviews` 和 `POST /api/products/:id/reviews`
- **帮助中心** (`Help.vue`) - 静态内容或 `GET /api/help`
- **关于我们** (`About.vue`) - 静态内容

### 替换建议

1. **创建API服务层**：建议在 `src/api/` 目录下创建统一的API调用函数
2. **统一错误处理**：所有API调用应包含错误处理逻辑
3. **加载状态**：添加loading状态，提升用户体验
4. **数据缓存**：考虑使用缓存机制，减少不必要的API调用
5. **逐步替换**：建议按功能模块逐步替换，先替换核心功能（登录、商品列表、购物车）

## 目录说明

- `src/`：前端源码
  - `views/`：页面组件
  - `components/`：可复用组件
  - `router/`：路由配置
  - `assets/`：静态资源（图片、样式等）
- `public/`：公共静态资源

## 公共组件

### Header 组件 (`components/Header.vue`)

顶部导航栏组件，包含以下功能：

- **Logo 和平台名称**：点击可返回首页
- **搜索框**：支持关键词搜索，跳转到搜索页面
- **购物车**：显示购物车图标和商品数量（当前从localStorage读取，需后续接入真实API）
- **用户菜单**：
  - 未登录：显示"登录"按钮
  - 已登录：显示用户名
- **导航菜单**：首页、分类浏览、论坛、帮助中心、关于我们

**特性**：
- 响应式设计，移动端自适应
- 使用红色主题色调
- 粘性定位（sticky），滚动时保持在顶部

### Footer 组件 (`components/Footer.vue`)

页脚组件，包含以下内容：

- **关于我们**：平台介绍、帮助中心、用户论坛
- **版权信息**：平台版权声明

**特性**：
- 简洁设计
- 深色背景，与红色主题形成对比
- 链接支持路由跳转

### 使用方式

公共组件已在 `App.vue` 中全局引入，所有页面自动包含 Header 和 Footer。

如需在特定页面隐藏公共组件，可以在该页面中通过 CSS 或条件渲染控制。

## 页面结构说明

### 核心功能页面（已实现占位符）

1. **主页** (`/`) - `Home.vue` ✅ 已实现
   - 平台首页展示
   - 包含CD播放器动画、论坛最新动态、精选商品展示

2. **用户认证相关**
   - **登录** (`/login`) - `Login.vue` ✅ 已实现（使用假账户数据）
   - **注册** (`/register`) - `Register.vue` ⏳ 占位符
   - **忘记密码** (`/forgot-password`) - `ForgotPassword.vue` ⏳ 占位符

3. **个人中心**
   - **个人页面** (`/profile`) - `Profile.vue` ⏳ 占位符 - 需登录
   - **商家端** (`/seller`) - `SellerDashboard.vue` ⏳ 占位符 - 需登录且为商家

4. **商品浏览**
   - **搜索展示页** (`/search`) - `Search.vue` ⏳ 占位符 - 商品搜索和列表展示（类似淘宝、亚马逊）
   - **商品分类** (`/category/:id?`) - `Category.vue` ✅ 已实现（使用假数据）
   - **商品详情** (`/product/:id`) - `ProductDetail.vue` ✅ 已实现（使用假数据）

5. **购物流程**
   - **购物车** (`/cart`) - `Cart.vue` ✅ 已实现（使用localStorage）
   - **结算/支付** (`/checkout`) - `Checkout.vue` ⏳ 占位符 - 需登录
   - **我的订单** (`/orders`) - `Orders.vue` ⏳ 占位符 - 需登录
   - **订单详情** (`/order/:id`) - `OrderDetail.vue` ⏳ 占位符 - 需登录

6. **其他功能**
   - **我的收藏** (`/wishlist`) - `Wishlist.vue` ⏳ 占位符 - 需登录
   - **商品评价** (`/review/:productId`) - `Review.vue` ⏳ 占位符 - 需登录
   - **论坛** (`/forum`) - `Forum.vue` ✅ 已实现（使用假数据）
   - **帮助中心** (`/help`) - `Help.vue` ⏳ 占位符
   - **关于我们** (`/about`) - `About.vue` ⏳ 占位符

**图例说明**：
- ✅ 已实现：页面已完成基础功能，可能使用假数据
- ⏳ 占位符：页面文件已创建，但功能待实现

### 补充说明

以下页面是基于常见购物网站功能补充的：

- **注册页面**：原需求中只有登录，补充了注册功能
- **忘记密码页面**：用户找回密码功能
- **商品分类页面**：分类浏览功能，方便用户按类别查找商品
- **结算/支付页面**：订单确认后的支付流程
- **订单详情页**：查看单个订单的详细信息
- **我的收藏页面**：用户收藏/心愿单功能
- **商品评价页面**：用户对商品进行评价和评论
- **帮助中心**：客服和帮助文档
- **关于我们**：平台介绍页面

**注意**：收货地址管理功能已从用户菜单中移除，地址信息将不存储在用户路径下。

### 路由配置

路由配置文件位于 `src/router/index.js`，已配置所有页面的路由规则。

**路由守卫说明**：
- `meta.requiresAuth: true` - 需要登录才能访问
- `meta.requiresSeller: true` - 需要商家权限才能访问
- 路由守卫逻辑待实现（当前已注释，需要根据实际认证方案实现）

### 设计规范

- **整体色调**：红色调（凤凰花树的颜色）
- **平台名称**：凤凰花开的路口
- **平台类型**：二手唱片购物平台

### 响应式设计说明

**当前开发状态**：
- ✅ **电脑端**：已完成基础布局和样式，支持响应式断点
- ⏳ **移动端**：样式已预留空间，但具体实现将在后续开发中完成

**说明**：
- 所有页面组件已包含设备类型检测逻辑
- CSS 媒体查询已设置移动端断点，但具体样式暂时留空
- 移动端适配将在电脑端功能完善后进行开发

### 多语言支持（i18n）

项目已集成 `vue-i18n`，支持多语言切换。

**支持的语言**：
- 简体中文（zh-CN）- ✅ 已完成
- 繁体中文（zh-TW）- ⏳ 测试阶段使用简体中文
- 英文（en）- ⏳ 测试阶段使用简体中文

**语言文件位置**：
- `src/i18n/locales/zh-CN.json` - 简体中文
- `src/i18n/locales/zh-TW.json` - 繁体中文（已创建，待完善）
- `src/i18n/locales/en.json` - 英文（已创建，待完善）

**使用方式**：
- 在组件中使用 `$t('key')` 或 `t('key')` 获取翻译文本
- Header 右上角提供语言切换下拉菜单（🌐 图标）
- 语言选择会保存到 localStorage，刷新后保持

**⚠️ 重要说明 - 测试阶段配置**：

**当前配置**（测试阶段）：
- 所有语言（zh-CN、zh-TW、en）都指向 `zh-CN.json` 文件
- 配置位置：`src/i18n/index.js`
- 目的：保证测试阶段开发稳定性，避免因翻译缺失导致的功能异常

**恢复多语言配置**（开发完毕后）：
1. 打开 `src/i18n/index.js`
2. 取消注释以下代码：
   ```javascript
   import zhTW from './locales/zh-TW.json'
   import en from './locales/en.json'
   ```
3. 修改 messages 配置：
   ```javascript
   messages: {
     'zh-CN': zhCN,
     'zh-TW': zhTW,  // 恢复为繁体中文
     'en': en        // 恢复为英文
   }
   ```

**当前状态**：
- 简体中文：所有内容已完成翻译
- 繁体中文和英文：已创建占位文件，内容待完善
- 测试阶段：所有语言切换都显示简体中文内容

### 测试账户信息

**⚠️ 开发阶段使用假账户数据**

项目在开发阶段使用假账户数据进行测试，账户信息存储在 `src/utils/auth.js` 中。

**测试账户列表**：

| 用户名 | 密码 | 角色 | 说明 |
| --- | --- | --- | --- |
| `user1` | `123456` | 普通用户 | 张三 |
| `user2` | `123456` | 普通用户 | 李四 |
| `seller` | `123456` | 商家 | 商家账号 |

**使用说明**：
- 登录页面会显示测试账号提示
- 登录成功后，用户信息会保存到 `localStorage`
- Header 组件会自动读取登录状态并更新显示
- 登出功能已实现，会清除用户信息

**用户状态管理**：
- 位置：`src/utils/auth.js`
- 功能：登录验证、用户状态管理、购物车数量获取
- 存储：使用 `localStorage` 存储当前用户信息

**后续开发**：
- 待后端API完成后，替换 `src/utils/auth.js` 中的假数据逻辑
- 接入真实的登录API和用户状态管理

## 响应式布局与元单位

### 全局样式文件

全局样式文件位于 `src/assets/styles/` 目录：

- `variables.css` - 全局变量定义（元单位、断点、颜色等）
- `global.css` - 全局样式和工具类

全局样式已在 `main.js` 中引入，所有组件自动生效。

### Rem 基准单位

项目使用 **rem** 作为主要单位，基准字体大小定义在 `:root` 中：

- **默认基准**：`16px`（1rem = 16px）
- **小屏设备**（≤575px）：`14px`
- **中屏设备**（576px-767px）：`15px`
- **大屏设备**（≥768px）：`16px`

**使用建议**：
- 优先使用 `rem` 单位进行尺寸设置
- 使用 CSS 变量（如 `var(--spacing-md)`）保持一致性
- 避免直接使用 `px`，除非是边框等固定尺寸

### 响应式断点

项目定义了以下断点（存储在 CSS 变量中）：

| 断点 | 宽度 | 设备类型 |
| --- | --- | --- |
| `--breakpoint-xs` | 0px | 超小屏（手机竖屏） |
| `--breakpoint-sm` | 576px | 小屏（手机横屏） |
| `--breakpoint-md` | 768px | 中屏（平板） |
| `--breakpoint-lg` | 992px | 大屏（小桌面） |
| `--breakpoint-xl` | 1200px | 超大屏（桌面） |
| `--breakpoint-xxl` | 1400px | 超超大屏（大桌面） |

**使用示例**：
```css
/* 在组件中使用媒体查询 */
@media (min-width: 768px) {
  .my-component {
    font-size: var(--font-size-lg);
  }
}
```

### 间距系统

间距使用 CSS 变量定义，基于 rem 单位：

| 变量 | 值 | 实际大小 |
| --- | --- | --- |
| `--spacing-xs` | 0.25rem | 4px |
| `--spacing-sm` | 0.5rem | 8px |
| `--spacing-md` | 1rem | 16px |
| `--spacing-lg` | 1.5rem | 24px |
| `--spacing-xl` | 2rem | 32px |
| `--spacing-xxl` | 3rem | 48px |
| `--spacing-xxxl` | 4rem | 64px |

**使用示例**：
```css
.my-component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

### 字体大小系统

字体大小也使用 CSS 变量：

| 变量 | 值 | 实际大小 |
| --- | --- | --- |
| `--font-size-xs` | 0.75rem | 12px |
| `--font-size-sm` | 0.875rem | 14px |
| `--font-size-base` | 1rem | 16px |
| `--font-size-lg` | 1.125rem | 18px |
| `--font-size-xl` | 1.25rem | 20px |
| `--font-size-xxl` | 1.5rem | 24px |
| `--font-size-xxxl` | 2rem | 32px |

### 容器最大宽度

响应式容器的最大宽度：

| 断点 | 最大宽度 |
| --- | --- |
| xs | 100% |
| sm | 540px |
| md | 720px |
| lg | 960px |
| xl | 1140px |
| xxl | 1320px |

使用 `.container` 类即可自动应用响应式容器样式。

### 其他全局变量

- **圆角**：`--border-radius-sm`、`--border-radius-md`、`--border-radius-lg`、`--border-radius-full`
- **阴影**：`--shadow-sm`、`--shadow-md`、`--shadow-lg`、`--shadow-xl`
- **过渡时间**：`--transition-fast` (150ms)、`--transition-base` (300ms)、`--transition-slow` (500ms)

### 工具类

全局样式提供了一些实用的工具类：

- `.container` - 响应式容器
- `.text-center`、`.text-left`、`.text-right` - 文本对齐
- `.hidden` - 隐藏元素
- `.hidden-xs`、`.hidden-sm`、`.hidden-md`、`.hidden-lg`、`.hidden-xl` - 响应式隐藏

### 开发建议

1. **统一使用 CSS 变量**：保持设计系统的一致性
2. **优先使用 rem**：确保响应式布局正常工作
3. **使用容器类**：`.container` 类已处理响应式逻辑
4. **遵循断点规范**：使用定义的断点进行媒体查询
5. **查看变量文件**：需要新变量时，在 `variables.css` 中添加
