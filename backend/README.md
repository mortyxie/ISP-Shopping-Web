```markdown
# Record Store Backend API

This is the backend API for the Record Store e-commerce platform. It provides RESTful endpoints for user authentication, product management, shopping cart, orders, and forum functionality.

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **SQLite3** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing

## 📁 Project Structure

```
backend/
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── database/
│   ├── record_store.db    # SQLite database file
│   ├── schema.sql         # Database schema
│   └── seed.js            # Seed data for testing
└── README.md              # This file
```

## 🛠️ Installation

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the backend folder:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-key-change-this
   ```

4. **Set up the database**
   ```bash
   # Create database from schema
   cd database
   sqlite3 record_store.db < schema.sql
   
   # Go back to backend and seed with test data
   cd ..
   node database/seed.js
   ```

## 🚦 Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if server is running |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/login` | User login |
| POST | `/api/users/register` | User registration |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with filters) |
| GET | `/api/products/:id` | Get single product by ID |

### Albums
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/albums` | Get all albums with product counts |
| GET | `/api/albums/:id` | Get single album |
| GET | `/api/albums/:id/with-products` | Get album with all its products |
| GET | `/api/albums/featured` | Get featured albums for homepage |

### Cart (Protected - requires login)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart items |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update` | Update item quantity |
| DELETE | `/api/cart/remove/:productId` | Remove item from cart |
| GET | `/api/cart/summary` | Get cart count and total |

### Forum
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forum/messages` | Get forum messages |
| POST | `/api/forum/messages` | Post new message (protected) |

## 🔐 Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 🧪 Test Accounts

After running the seed file, you can use these test accounts:

| Username | Password | Role |
|----------|----------|------|
| user1 | 123456 | Customer |
| user2 | 123456 | Customer |
| seller | 123456 | Admin/Seller |

## 📦 Database Schema

The database consists of 8 tables:

- `Users` - User accounts
- `Albums` - Album information (title, artist, etc.)
- `Products` - Individual items for sale (condition, price)
- `Cart_Items` - Shopping cart items
- `Orders` - Order headers
- `Order_Items` - Order line items
- `Reviews` - Product reviews
- `Discussion_Bubbles` - Forum messages

## 🐛 Troubleshooting

**Database errors**
```bash
# Reset the database
cd database
rm record_store.db
sqlite3 record_store.db < schema.sql
cd ..
node database/seed.js
```

**Port already in use**
```bash
# Change port in .env file
PORT=3001
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| JWT_SECRET | Secret for JWT tokens | (required) |

## 🤝 Frontend Integration

The frontend should be configured to proxy API requests to this backend. In your Vite config:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
}
```

## 📄 License

This project is for educational purposes.
```

Just copy this entire block and paste it into your `backend/README.md` file. The markdown formatting will render properly with tables, code blocks, and all the styling.