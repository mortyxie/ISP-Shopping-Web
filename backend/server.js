const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

app.use(cors());
// Seller dashboard uploads product images as base64 strings in JSON (can be several MB).
// Increase body size limit to avoid 413 Payload Too Large.
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Connect to database
const db = new sqlite3.Database(path.join(__dirname, 'database', 'record_store.db'), (err) => {
    if (err) {
        console.error(' Database connection error:', err.message);
    } else {
        console.log(' Connected to SQLite database');
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// One-time migration: add `selected` column to Cart_Items (0/1)
db.all("PRAGMA table_info('Cart_Items')", (err, columns) => {
  if (err) {
    console.error('Failed to inspect Cart_Items schema:', err);
    return;
  }
  const hasSelected = Array.isArray(columns) && columns.some((c) => c?.name === 'selected');
  if (hasSelected) return;

  console.log('Migrating Cart_Items: adding selected column...');
  db.run('ALTER TABLE Cart_Items ADD COLUMN selected INTEGER NOT NULL DEFAULT 1', (err2) => {
    if (err2) {
      console.error('Failed to add Cart_Items.selected column:', err2);
      return;
    }
    console.log('Migration complete: Cart_Items.selected added.');
  });
});

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const requireSeller = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Seller access required' });
  }
  next();
};

const preventSelfBuy = (req, res, next) => {
  // This will be used in cart endpoints
  req.preventSelfBuy = true;
  next();
};

// ==================== USERS API ====================
app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(
        'SELECT * FROM Users WHERE username = ? OR email = ?',
        [username, username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (!user) {
                return res.json({ 
                    success: false, 
                    message: 'Log In Invalid' 
                });
            }
            
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.json({ 
                    success: false, 
                    message: 'Log In Invalid' 
                });
            }
            
            const token = jwt.sign(
                { userId: user.user_id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                user: {
                    id: user.user_id,
                    username: user.username,
                    name: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar_url
                },
                token
            });
        }
    );
});

// Forgot password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: '请输入邮箱地址'
    });
  }

  // Check if user exists with this email
  db.get(
    'SELECT * FROM Users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // For security, don't reveal if email exists
      // Just return success message
      res.json({
        success: true,
        message: '如果该邮箱已注册，重置密码链接已发送到您的邮箱'
      });
    }
  );
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if user exists
  db.get('SELECT * FROM Users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      db.run(
        'UPDATE Users SET password_hash = ? WHERE email = ?',
        [hashedPassword, email],
        function(err) {
          if (err) {
            console.error('Error updating password:', err);
            return res.status(500).json({ error: 'Failed to reset password' });
          }
          
          res.json({ 
            success: true, 
            message: 'Password reset successful' 
          });
        }
      );
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.get(
    `SELECT 
      user_id,
      username,
      email,
      role,
      avatar_url,
      created_at
    FROM Users
    WHERE user_id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get order count for this user
      db.get(
        'SELECT COUNT(*) as orderCount FROM Orders WHERE user_id = ?',
        [userId],
        (err, orderResult) => {
          if (err) {
            console.error('Error fetching order count:', err);
            return res.json({
              ...user,
              orderCount: 0
            });
          }
          
          res.json({
            ...user,
            orderCount: orderResult?.orderCount || 0
          });
        }
      );
    }
  );
});

// ==================== SELLER API ====================

// Get seller's albums
app.get('/api/seller/albums', authenticateToken, requireSeller, (req, res) => {
  db.all(
    `SELECT 
      a.*,
      COUNT(p.product_id) as product_count
    FROM Albums a
    LEFT JOIN Products p ON a.album_id = p.album_id
    GROUP BY a.album_id
    ORDER BY a.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get seller's products
app.get('/api/seller/products', authenticateToken, requireSeller, (req, res) => {
  db.all(
    `SELECT
      p.*,
      a.title as album_title,
      a.cover_image_url as album_cover
    FROM Products p
    JOIN Albums a ON p.album_id = a.album_id
    ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get seller's product by product_id (fuzzy search)
app.get('/api/seller/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;

  db.all(
    `SELECT
      p.*,
      a.title as album_title,
      a.artist,
      a.genre,
      a.release_year,
      a.tracklist,
      a.cover_image_url as album_cover
    FROM Products p
    JOIN Albums a ON p.album_id = a.album_id
    WHERE CAST(p.product_id AS TEXT) LIKE ?
    ORDER BY p.product_id ASC
    LIMIT 50`,
    [`%${productId}%`],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(products || []);
    }
  );
});

// Get seller's orders
app.get('/api/seller/orders', authenticateToken, requireSeller, (req, res) => {
  db.all(
    `SELECT 
      o.order_id,
      o.total_amount,
      o.status,
      o.created_at,
      o.shipping_address,
      u.username as customer_name,
      COUNT(oi.order_item_id) as item_count
    FROM Orders o
    JOIN Users u ON o.user_id = u.user_id
    JOIN Order_Items oi ON o.order_id = oi.order_id
    JOIN Products p ON oi.product_id = p.product_id
    JOIN Albums a ON p.album_id = a.album_id
    GROUP BY o.order_id
    ORDER BY o.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Create new album
app.post('/api/albums', authenticateToken, requireSeller, (req, res) => {
  const { title, artist, cover_image, genre, tracklist, release_year } = req.body;
  
  db.run(
    `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [title, artist, cover_image, genre, tracklist, release_year],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        success: true, 
        album_id: this.lastID,
        message: 'Album created successfully' 
      });
    }
  );
});

// Update album
app.put('/api/albums/:id', authenticateToken, requireSeller, (req, res) => {
  const albumId = req.params.id;
  const { title, artist, cover_image, genre, tracklist, release_year } = req.body;
  
  db.run(
    `UPDATE Albums 
     SET title = ?, artist = ?, cover_image_url = ?, genre = ?, tracklist = ?, release_year = ?
     WHERE album_id = ?`,
    [title, artist, cover_image, genre, tracklist, release_year, albumId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Album updated successfully' });
    }
  );
});

// Search albums
app.get('/api/albums/search', (req, res) => {
  const { search, genre, limit = 20, offset = 0 } = req.query;
  
  let sql = `
    SELECT 
      album_id,
      title,
      artist,
      cover_image_url,
      genre,
      release_year,
      (SELECT COUNT(*) FROM Products WHERE album_id = Albums.album_id AND is_active = 1) as product_count
    FROM Albums
    WHERE 1=1
  `;
  const params = [];
  
  if (search) {
    sql += ' AND (title LIKE ? OR artist LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (genre) {
    sql += ' AND genre = ?';
    params.push(genre);
  }
  
  sql += ' ORDER BY title LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create new product
app.post('/api/products', authenticateToken, requireSeller, (req, res) => {
  const { album_id, condition, price, description, images } = req.body;
  
  db.run(
    `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [album_id, condition, price, description, JSON.stringify(images)], // Store images as JSON string
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        success: true, 
        product_id: this.lastID,
        message: 'Product added successfully' 
      });
    }
  );
});

// Update product
app.put('/api/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  const { condition, price, description, images } = req.body;
  
  db.run(
    `UPDATE Products 
     SET condition = ?, price = ?, description = ?, image_urls = ?
     WHERE product_id = ?`,
    [condition, price, description, JSON.stringify(images), productId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Product updated successfully' });
    }
  );
});

// Get single order for seller (by order ID only, no user check)
app.get('/api/seller/orders/:id', authenticateToken, requireSeller, (req, res) => {
  const orderId = req.params.id;
  
  db.get(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at,
      o.shipping_address,
      o.payment_method,
      o.transaction_id,
      o.paid_at,
      u.username as customer_name,
      u.email as customer_email
    FROM Orders o
    JOIN Users u ON o.user_id = u.user_id
    WHERE o.order_id = ?`,
    [orderId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      db.all(
        `SELECT 
          oi.order_item_id as id,
          oi.quantity,
          oi.price_at_purchase as price,
          p.condition,
          a.title as name,
          a.cover_image_url as image
        FROM Order_Items oi
        JOIN Products p ON oi.product_id = p.product_id
        JOIN Albums a ON p.album_id = a.album_id
        WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Calculate subtotal
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          res.json({
            ...order,
            items: items || [],
            subtotal,
            shipping_cost: 0
          });
        }
      );
    }
  );
});

// ==================== PRODUCTS API ====================
app.get('/api/products', (req, res) => {
    const { category, search, limit } = req.query;
    
    let sql = `
        SELECT 
            p.product_id as id,
            a.title as name,
            a.artist,
            a.cover_image_url as image,
            p.price,
            p.condition,
            p.description,
            a.genre as category
        FROM Products p
        JOIN Albums a ON p.album_id = a.album_id
        WHERE p.is_active = 1
    `;
    const params = [];
    
    if (category && category !== 'undefined') {
        sql += ' AND a.genre = ?';
        params.push(category);
    }
    
    if (search) {
        sql += ' AND (a.title LIKE ? OR a.artist LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ' ORDER BY p.created_at DESC';
    
    if (limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(limit));
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    
    db.get(
        `SELECT 
            p.product_id as id,
            a.title as name,
            a.artist,
            a.cover_image_url as image,
            p.image_urls,  
            p.price,
            p.condition,
            p.description,
            a.genre,
            a.release_year,
            a.tracklist
        FROM Products p
        JOIN Albums a ON p.album_id = a.album_id
        WHERE p.product_id = ?`,
        [productId],
        (err, product) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        }
    );
});

// Delete product - SELLER CAN ALWAYS DO IT
app.delete('/api/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  
  // First, delete from Cart_Items (foreign key constraint)
  db.run('DELETE FROM Cart_Items WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Error deleting from cart:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Then delete from Order_Items
    db.run('DELETE FROM Order_Items WHERE product_id = ?', [productId], (err) => {
      if (err) {
        console.error('Error deleting from order items:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Finally delete the product
      db.run('DELETE FROM Products WHERE product_id = ?', [productId], function(err) {
        if (err) {
          console.error('Error deleting product:', err);
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ success: true, message: 'Product deleted successfully' });
      });
    });
  });
});

// Toggle product - SELLER CAN ALWAYS DO IT
app.put('/api/products/:id/toggle', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  
  db.run(
    `UPDATE Products SET is_active = NOT is_active WHERE product_id = ?`,
    [productId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ==================== CART API ====================

// Get cart items
app.get('/api/cart', authenticateToken, (req, res) => {
  db.all(
    `SELECT 
        p.product_id as id,
        a.title as name,
        a.artist,
        a.cover_image_url as image,
        p.price,
        p.condition,
        p.is_active,
        COALESCE(ci.selected, 1) as quantity
    FROM Cart_Items ci
    JOIN Products p ON ci.product_id = p.product_id
    JOIN Albums a ON p.album_id = a.album_id
    WHERE ci.user_id = ?`,
    [req.user.userId],
    (err, items) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      // Return all cart items, including inactive (sold out) ones
      res.json(items || []);
    }
  );
});

// Add to cart - SIMPLE: just check if product exists
app.post('/api/cart/add', authenticateToken, (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.userId;
  
  // Check if product exists
  db.get('SELECT * FROM Products WHERE product_id = ?', [product_id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.is_active === 0) return res.status(400).json({ error: 'Product already sold' });
    
    // Check if already in cart
    db.get(
      'SELECT * FROM Cart_Items WHERE user_id = ? AND product_id = ?',
      [userId, product_id],
      (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing) return res.status(400).json({ error: 'Product already in cart' });
        
        // Add to cart
        db.run(
          'INSERT INTO Cart_Items (user_id, product_id, quantity) VALUES (?, ?, 1)',
          [userId, product_id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
          }
        );
      }
    );
  });
});

// Remove from cart
app.delete('/api/cart/remove/:productId', authenticateToken, (req, res) => {
  const productId = req.params.productId;
  const userId = req.user.userId;
  
  db.run(
    'DELETE FROM Cart_Items WHERE user_id = ? AND product_id = ?',
    [userId, productId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Clear cart
app.delete('/api/cart/clear', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM Cart_Items WHERE user_id = ?',
    [req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Update cart quantity (unique items: 0 or 1)
app.put('/api/cart/update', authenticateToken, (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.userId;

  if (!product_id) return res.status(400).json({ error: 'product_id required' });
  const q = parseInt(quantity, 10);
  if (![0, 1].includes(q)) return res.status(400).json({ error: 'quantity must be 0 or 1' });

  if (q === 0) {
    db.run(
      'UPDATE Cart_Items SET selected = 0 WHERE user_id = ? AND product_id = ?',
      [userId, product_id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ success: true });
      }
    );
    return;
  }

  // q === 1: ensure product is available then mark selected=1 (insert if missing)
  db.get('SELECT is_active FROM Products WHERE product_id = ?', [product_id], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.is_active === 0) return res.status(400).json({ error: 'Product already sold' });

    db.run(
      'INSERT OR IGNORE INTO Cart_Items (user_id, product_id, quantity, selected) VALUES (?, ?, 1, 1)',
      [userId, product_id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run(
          'UPDATE Cart_Items SET selected = 1 WHERE user_id = ? AND product_id = ?',
          [userId, product_id],
          function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            return res.json({ success: true });
          }
        );
      }
    );
  });
});

// Get cart summary
app.get('/api/cart/summary', authenticateToken, (req, res) => {
  db.get(
    `SELECT 
        COUNT(*) as count
    FROM Cart_Items ci
    JOIN Products p ON ci.product_id = p.product_id
    WHERE ci.user_id = ? AND COALESCE(ci.selected, 1) = 1 AND p.is_active = 1`,
    [req.user.userId],
    (err, summary) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        count: summary?.count || 0
      });
    }
  );
});

// ==================== ORDERS API ====================

// Create order - accepts items from request
app.post('/api/orders/create', authenticateToken, (req, res) => {
  const { shipping_address, payment_method, items } = req.body;
  const userId = req.user.userId;
  
  if (!shipping_address) {
    return res.status(400).json({ error: 'Shipping address required' });
  }
  
  // Use items from request if provided, otherwise get from cart
  if (items && items.length > 0) {
    // Create order with provided items (for Buy Now)
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Calculate total
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      const shipping = subtotal >= 500 ? 0 : 50;
      const total = subtotal + shipping;
      
      // Create order
      db.run(
        `INSERT INTO Orders (user_id, total_amount, shipping_address, payment_method, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [userId, total, shipping_address, payment_method],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          const orderId = this.lastID;
          
          // Create order items
          const stmt = db.prepare(
            'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)'
          );
          
          items.forEach(item => {
            stmt.run([orderId, item.product_id, item.price]);
          });
          
          stmt.finalize();
          
          db.run('COMMIT');
          res.json({ success: true, order_id: orderId });
        }
      );
    });
  } else {
    // Fall back to cart (original logic)
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      db.all(
        `SELECT ci.product_id, p.price
        FROM Cart_Items ci
        JOIN Products p ON ci.product_id = p.product_id
        WHERE ci.user_id = ? AND COALESCE(ci.selected, 1) = 1`,
        [userId],
        (err, cartItems) => {
          if (err || !cartItems || cartItems.length === 0) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Cart is empty' });
          }
          
          const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
          const shipping = subtotal >= 500 ? 0 : 50;
          const total = subtotal + shipping;
          
          db.run(
            `INSERT INTO Orders (user_id, total_amount, shipping_address, payment_method, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
            [userId, total, shipping_address, payment_method],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }
              
              const orderId = this.lastID;
              
              const stmt = db.prepare(
                'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)'
              );
              cartItems.forEach(item => {
                stmt.run([orderId, item.product_id, item.price]);
              });
              stmt.finalize();
              
              db.run('DELETE FROM Cart_Items WHERE user_id = ?', [userId], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }
                
                db.run('COMMIT');
                res.json({ success: true, order_id: orderId });
              });
            }
          );
        }
      );
    });
  }
});

/// Get user's orders (with all timestamp fields)
app.get('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at as date,
      o.paid_at,
      o.shipped_at,
      o.completed_at,
      o.cancelled_at,
      o.shipping_address,
      o.payment_method,
      o.transaction_id
    FROM Orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const ordersWithItems = orders.map(order => {
        return new Promise((resolve, reject) => {
          db.all(
            `SELECT 
              oi.order_item_id as order_item_id,
              oi.quantity,
              oi.price_at_purchase as price,
              p.condition,
              a.title as name,
              a.cover_image_url as image,
              a.album_id,
              p.product_id as id
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.product_id
            JOIN Albums a ON p.album_id = a.album_id
            WHERE oi.order_id = ?`,
            [order.id],
            (err, items) => {
              if (err) reject(err);
              resolve({
                ...order,
                items: items || []
              });
            }
          );
        });
      });
      
      Promise.all(ordersWithItems)
        .then(results => res.json(results))
        .catch(err => res.status(500).json({ error: err.message }));
    }
  );
});

// Get single order for user (with all timestamp fields)
app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;
  
  db.get(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at,
      o.paid_at,
      o.shipped_at,
      o.completed_at,
      o.cancelled_at,
      o.shipping_address,
      o.payment_method,
      o.transaction_id
    FROM Orders o
    WHERE o.order_id = ? AND o.user_id = ?`,
    [orderId, userId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      db.all(
        `SELECT 
          oi.order_item_id as order_item_id,
          oi.quantity,
          oi.price_at_purchase as price,
          p.condition,
          a.title as name,
          a.cover_image_url as image,
          a.album_id,
          p.product_id as id
        FROM Order_Items oi
        JOIN Products p ON oi.product_id = p.product_id
        JOIN Albums a ON p.album_id = a.album_id
        WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const shipping = subtotal >= 500 ? 0 : 50;
          
          res.json({
            ...order,
            items: items || [],
            subtotal,
            shipping_cost: shipping
          });
        }
      );
    }
  );
});

// Get single order for seller
app.get('/api/seller/orders/:id', authenticateToken, requireSeller, (req, res) => {
  const orderId = req.params.id;
  
  db.get(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at,
      o.shipping_address,
      o.payment_method,
      o.transaction_id,
      o.paid_at,
      u.username as customer_name,
      u.email as customer_email
    FROM Orders o
    JOIN Users u ON o.user_id = u.user_id
    WHERE o.order_id = ?`,
    [orderId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      db.all(
        `SELECT 
          oi.order_item_id as id,
          oi.quantity,
          oi.price_at_purchase as price,
          p.condition,
          a.title as name,
          a.cover_image_url as image
        FROM Order_Items oi
        JOIN Products p ON oi.product_id = p.product_id
        JOIN Albums a ON p.album_id = a.album_id
        WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Calculate subtotal
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const shipping = subtotal >= 500 ? 0 : 50;
          
          res.json({
            ...order,
            items: items || [],
            subtotal,
            shipping_cost: shipping,
            total: order.total
          });
        }
      );
    }
  );
});

// Cancel order - reactivate products
app.put('/api/orders/:id/cancel', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;
  
  db.get(
    'SELECT status FROM Orders WHERE order_id = ? AND user_id = ?',
    [orderId, userId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending orders can be cancelled' });
      }
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Get products in this order
        db.all(
          'SELECT product_id FROM Order_Items WHERE order_id = ?',
          [orderId],
          (err, items) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            
            // Reactivate products
            const stmt = db.prepare('UPDATE Products SET is_active = 1 WHERE product_id = ?');
            items.forEach(item => {
              stmt.run([item.product_id]);
            });
            stmt.finalize();
            
            // Update order status
            db.run(
              'UPDATE Orders SET status = ? WHERE order_id = ?',
              ['cancelled', orderId],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }
                
                db.run('COMMIT');
                res.json({ success: true, message: 'Order cancelled successfully' });
              }
            );
          }
        );
      });
    }
  );
});

// Complete order (confirm receipt)
app.put('/api/orders/:id/complete', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;
  
  db.get(
    'SELECT status FROM Orders WHERE order_id = ? AND user_id = ?',
    [orderId, userId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (order.status !== 'shipped') {
        return res.status(400).json({ error: 'Only shipped orders can be completed' });
      }
      
      db.run(
        'UPDATE Orders SET status = ? WHERE order_id = ?',
        ['completed', orderId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, message: 'Order completed successfully' });
        }
      );
    }
  );
});

// Pay order - SIMPLE: check if product still active, then deactivate
app.post('/api/orders/:id/pay', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;
  
  db.get(
    'SELECT * FROM Orders WHERE order_id = ? AND user_id = ?',
    [orderId, userId],
    (err, order) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.status !== 'pending') return res.status(400).json({ error: 'Order not pending' });
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Get products
        db.all(
          'SELECT product_id FROM Order_Items WHERE order_id = ?',
          [orderId],
          (err, items) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            
            // Check if any product is already sold
            const productIds = items.map(item => item.product_id);
            const placeholders = productIds.map(() => '?').join(',');
            
            db.all(
              `SELECT product_id FROM Products WHERE product_id IN (${placeholders}) AND is_active = 0`,
              productIds,
              (err, soldProducts) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }
                
                if (soldProducts && soldProducts.length > 0) {
                  db.run('ROLLBACK');
                  return res.status(400).json({ error: 'Some products already sold' });
                }
                
                // Deactivate products
                const stmt = db.prepare('UPDATE Products SET is_active = 0 WHERE product_id = ?');
                items.forEach(item => stmt.run([item.product_id]));
                stmt.finalize();
                
                // Update order
                db.run(
                  `UPDATE Orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE order_id = ?`,
                  [orderId],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }
                    
                    db.run('COMMIT');
                    res.json({ success: true });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

// ==================== REVIEWS API ====================

// Get reviews for album with replies
app.get('/api/reviews/album/:albumId', (req, res) => {
  const albumId = req.params.albumId;
  
  db.all(
    `SELECT 
      r.review_id,
      r.rating,
      r.comment,
      r.created_at,
      u.user_id,
      u.username,
      u.avatar_url,
      u.role,
      p.product_id,
      p.condition as sku_condition
    FROM Reviews r
    JOIN Users u ON r.user_id = u.user_id
    JOIN Products p ON r.product_id = p.product_id
    WHERE p.album_id = ?
    ORDER BY r.created_at DESC`,
    [albumId],
    (err, reviews) => {
      if (err) {
        console.error('Error fetching reviews:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (reviews.length === 0) {
        return res.json([]);
      }
      
      // Get all replies for these reviews
      const reviewIds = reviews.map(r => r.review_id);
      const placeholders = reviewIds.map(() => '?').join(',');
      
      db.all(
        `SELECT 
          rr.reply_id,
          rr.review_id,
          rr.content,
          rr.created_at,
          rr.parent_reply_id,
          u.user_id,
          u.username,
          u.avatar_url,
          u.role
        FROM Review_Replies rr
        JOIN Users u ON rr.user_id = u.user_id
        WHERE rr.review_id IN (${placeholders})
        ORDER BY rr.created_at ASC`,
        reviewIds,
        (err, replies) => {
          if (err) {
            console.error('Error fetching replies:', err);
            return res.status(500).json({ error: err.message });
          }
          
          // Group replies by review_id
          const repliesByReview = {};
          replies.forEach(reply => {
            if (!repliesByReview[reply.review_id]) {
              repliesByReview[reply.review_id] = [];
            }
            repliesByReview[reply.review_id].push(reply);
          });
          
          // Organize into nested structure
          const nestedRepliesByReview = {};
          Object.keys(repliesByReview).forEach(reviewId => {
            const replyMap = new Map();
            const nestedReplies = [];
            
            repliesByReview[reviewId].forEach(reply => {
              reply.replies = [];
              replyMap.set(reply.reply_id, reply);
              
              if (reply.parent_reply_id === null) {
                nestedReplies.push(reply);
              } else {
                const parent = replyMap.get(reply.parent_reply_id);
                if (parent) {
                  parent.replies.push(reply);
                }
              }
            });
            
            nestedRepliesByReview[reviewId] = nestedReplies;
          });
          
          // Add replies to reviews
          const reviewsWithReplies = reviews.map(review => ({
            ...review,
            replies: nestedRepliesByReview[review.review_id] || []
          }));
          
          res.json(reviewsWithReplies);
        }
      );
    }
  );
});

// Add reply to a review (no edit/delete)
app.post('/api/reviews/:reviewId/reply', authenticateToken, (req, res) => {
  const reviewId = req.params.reviewId;
  const { content, parent_reply_id } = req.body;
  const userId = req.user.userId;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Reply content cannot be empty' });
  }
  
  if (content.length > 500) {
    return res.status(400).json({ error: 'Reply must be less than 500 characters' });
  }
  
  // Check if review exists
  db.get('SELECT review_id FROM Reviews WHERE review_id = ?', [reviewId], (err, review) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // If parent_reply_id is provided, check if it exists
    if (parent_reply_id) {
      db.get(
        'SELECT reply_id FROM Review_Replies WHERE reply_id = ? AND review_id = ?',
        [parent_reply_id, reviewId],
        (err, parentReply) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (!parentReply) {
            return res.status(404).json({ error: 'Parent reply not found' });
          }
          insertReply();
        }
      );
    } else {
      insertReply();
    }
    
    function insertReply() {
      db.run(
        `INSERT INTO Review_Replies (review_id, user_id, parent_reply_id, content, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [reviewId, userId, parent_reply_id || null, content.trim()],
        function(err) {
          if (err) {
            console.error('Error creating reply:', err);
            return res.status(500).json({ error: err.message });
          }
          
          // Get the created reply with user info
          db.get(
            `SELECT 
              rr.reply_id,
              rr.content,
              rr.created_at,
              rr.parent_reply_id,
              u.user_id,
              u.username,
              u.avatar_url,
              u.role
            FROM Review_Replies rr
            JOIN Users u ON rr.user_id = u.user_id
            WHERE rr.reply_id = ?`,
            [this.lastID],
            (err, reply) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.status(201).json({ 
                success: true, 
                message: 'Reply added successfully',
                reply: reply
              });
            }
          );
        }
      );
    }
  });
});

// Get average rating for an album
app.get('/api/reviews/album/:albumId/average', (req, res) => {
  const albumId = req.params.albumId;
  
  db.get(
    `SELECT 
      AVG(r.rating) as avg_rating,
      COUNT(r.review_id) as review_count
    FROM Reviews r
    JOIN Products p ON r.product_id = p.product_id
    WHERE p.album_id = ?`,
    [albumId],
    (err, result) => {
      if (err) {
        console.error('Error fetching average rating:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        avg_rating: result?.avg_rating || 0,
        review_count: result?.review_count || 0
      });
    }
  );
});



// Create a new review
app.post('/api/reviews', authenticateToken, (req, res) => {
  const { product_id, order_id, rating, comment } = req.body;
  const userId = req.user.userId;
  
  console.log('=== REVIEW SUBMISSION ===');
  console.log('product_id:', product_id);
  console.log('order_id:', order_id);
  console.log('rating:', rating);
  console.log('comment:', comment);
  console.log('userId:', userId);
  
  if (!product_id || !order_id || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  // Check if product exists
  db.get('SELECT * FROM Products WHERE product_id = ?', [product_id], (err, product) => {
    if (err) {
      console.error('Error checking product:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if order exists, belongs to user, and is completed
    db.get(
      `SELECT * FROM Orders WHERE order_id = ? AND user_id = ? AND status = 'completed'`,
      [order_id, userId],
      (err, order) => {
        if (err) {
          console.error('Error checking order:', err);
          return res.status(500).json({ error: err.message });
        }
        if (!order) {
          return res.status(403).json({ error: 'You can only review completed orders' });
        }
        
        // Check if this specific product in this order has already been reviewed
        db.get(
          `SELECT review_id FROM Reviews WHERE order_id = ? AND product_id = ?`,
          [order_id, product_id],
          (err, existing) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            if (existing) {
              return res.status(400).json({ error: 'You have already reviewed this product in this order' });
            }
            
            // Insert review
            db.run(
              `INSERT INTO Reviews (user_id, product_id, order_id, rating, comment, created_at)
               VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [userId, product_id, order_id, rating, comment],
              function(err) {
                if (err) {
                  console.error('Error inserting review:', err);
                  return res.status(500).json({ error: err.message });
                }
                
                console.log('Review inserted successfully! ID:', this.lastID);
                res.json({ 
                  success: true, 
                  message: 'Review submitted successfully',
                  review_id: this.lastID
                });
              }
            );
          }
        );
      }
    );
  });
});

// Check which products in an order have been reviewed
app.get('/api/reviews/user/order/:orderId', authenticateToken, (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.userId;
  
  console.log('Fetching reviews for order:', orderId, 'user:', userId);
  
  // Get all reviews for this order to return which products were reviewed
  db.all(
    'SELECT product_id, review_id FROM Reviews WHERE order_id = ? AND user_id = ?',
    [orderId, userId],
    (err, reviews) => {
      if (err) {
        console.error('Error fetching reviews:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Found reviews:', reviews);
      
      // Return which products were reviewed
      res.json({ 
        hasReviewed: reviews.length > 0,
        reviewedProducts: reviews.map(r => r.product_id)
      });
    }
  );
});

// Check if user has reviewed a specific product in an order
app.get('/api/reviews/user/order/:orderId/product/:productId', authenticateToken, (req, res) => {
  const orderId = req.params.orderId;
  const productId = req.params.productId;
  const userId = req.user.userId;
  
  db.get(
    'SELECT review_id FROM Reviews WHERE order_id = ? AND product_id = ? AND user_id = ?',
    [orderId, productId, userId],
    (err, review) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ hasReviewed: !!review });
    }
  );
});

// ==================== FORUM API ====================
app.get('/api/forum/messages', (req, res) => {
    const { limit = 10 } = req.query;
    
    db.all(
        `SELECT 
            db.bubble_id as id,
            db.content,
            db.created_at,
            u.username,
            u.avatar_url
        FROM Discussion_Bubbles db
        JOIN Users u ON db.user_id = u.user_id
        ORDER BY db.created_at DESC
        LIMIT ?`,
        [parseInt(limit)],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows || []);
        }
    );
});

app.post('/api/forum/messages', authenticateToken, (req, res) => {
    const { content } = req.body;
    const userId = req.user.userId;
    
    if (!content || content.length > 144) {
        return res.status(400).json({ error: 'Content must be between 1-144 characters' });
    }
    
    db.run(
        'INSERT INTO Discussion_Bubbles (user_id, content) VALUES (?, ?)',
        [userId, content],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            
            db.get(
                `SELECT 
                    db.bubble_id as id,
                    db.content,
                    db.created_at,
                    u.username,
                    u.avatar_url
                FROM Discussion_Bubbles db
                JOIN Users u ON db.user_id = u.user_id
                WHERE db.bubble_id = ?`,
                [this.lastID],
                (err, message) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json(message);
                }
            );
        }
    );
});

// Register new user - always customer role
app.post('/api/users/register', async (req, res) => {
  const { username, email, password } = req.body;  // Should match what you send
  
  console.log('Registration attempt:', { username, email }); // Add this for debugging

  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, email and password are required' 
    });
  }

  // Check if user already exists
  db.get(
    'SELECT * FROM Users WHERE username = ? OR email = ?',
    [username, email],
    async (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username or email already exists' 
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [username, email, hashedPassword, 'customer'],
          function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
              success: true,
              message: 'User registered successfully',
              userId: this.lastID
            });
          }
        );
      } catch (error) {
        console.error('Hash error:', error);
        res.status(500).json({ error: error.message });
      }
    }
  );
});

// Get user profile (protected)
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get(
    `SELECT user_id, username, email, avatar_url, role, created_at
     FROM Users WHERE user_id = ?`,
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's order count
      db.get(
        'SELECT COUNT(*) as order_count FROM Orders WHERE user_id = ?',
        [req.user.userId],
        (err, orderStats) => {
          res.json({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
            role: user.role,
            created_at: user.created_at,
            orderCount: orderStats?.order_count || 0
          });
        }
      );
    }
  );
});

// ==================== SELLER API ====================

// Get seller's albums
app.get('/api/seller/albums', authenticateToken, requireSeller, (req, res) => {
  db.all(
    `SELECT 
      a.*,
      COUNT(p.product_id) as product_count
    FROM Albums a
    LEFT JOIN Products p ON a.album_id = p.album_id
    GROUP BY a.album_id
    ORDER BY a.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get seller's products
app.get('/api/seller/products', authenticateToken, requireSeller, (req, res) => {
  db.all(
    `SELECT
      p.*,
      a.title as album_title,
      a.cover_image_url as album_cover
    FROM Products p
    JOIN Albums a ON p.album_id = a.album_id
    ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get seller's product by product_id (fuzzy search)
app.get('/api/seller/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;

  db.all(
    `SELECT
      p.*,
      a.title as album_title,
      a.artist,
      a.genre,
      a.release_year,
      a.tracklist,
      a.cover_image_url as album_cover
    FROM Products p
    JOIN Albums a ON p.album_id = a.album_id
    WHERE CAST(p.product_id AS TEXT) LIKE ?
    ORDER BY p.product_id ASC
    LIMIT 50`,
    [`%${productId}%`],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(products || []);
    }
  );
});

// Get seller's orders (with all timestamp fields)
app.get('/api/seller/orders', authenticateToken, requireSeller, (req, res) => {
  db.all(
    `SELECT 
      o.order_id,
      o.total_amount,
      o.status,
      o.created_at,
      o.paid_at,
      o.shipped_at,
      o.completed_at,
      o.cancelled_at,
      o.shipping_address,
      u.username as customer_name,
      u.email as customer_email,
      COUNT(oi.order_item_id) as item_count
    FROM Orders o
    JOIN Users u ON o.user_id = u.user_id
    LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
    GROUP BY o.order_id
    ORDER BY o.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching seller orders:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get single order for seller (with all timestamp fields)
app.get('/api/seller/orders/:id', authenticateToken, requireSeller, (req, res) => {
  const orderId = req.params.id;
  
  db.get(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at,
      o.paid_at,
      o.shipped_at,
      o.completed_at,
      o.cancelled_at,
      o.shipping_address,
      o.payment_method,
      o.transaction_id,
      u.username as customer_name,
      u.email as customer_email
    FROM Orders o
    JOIN Users u ON o.user_id = u.user_id
    WHERE o.order_id = ?`,
    [orderId],
    (err, order) => {
      if (err) {
        console.error('Error fetching order:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      db.all(
        `SELECT 
          oi.order_item_id as id,
          oi.quantity,
          oi.price_at_purchase as price,
          p.condition,
          a.title as name,
          a.cover_image_url as image
        FROM Order_Items oi
        JOIN Products p ON oi.product_id = p.product_id
        JOIN Albums a ON p.album_id = a.album_id
        WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ error: err.message });
          }
          
          // Calculate subtotal
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const shipping = subtotal >= 500 ? 0 : 50;
          
          res.json({
            ...order,
            items: items || [],
            subtotal,
            shipping_cost: shipping
          });
        }
      );
    }
  );
});

// UPDATE ORDER STATUS - This is the missing endpoint
app.put('/api/seller/orders/:id/status', authenticateToken, requireSeller, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // Check if order exists
  db.get('SELECT * FROM Orders WHERE order_id = ?', [orderId], (err, order) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order status - triggers will automatically set the appropriate timestamp
    db.run(
      'UPDATE Orders SET status = ? WHERE order_id = ?',
      [status, orderId],
      function(err) {
        if (err) {
          console.error('Error updating order status:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Fetch the updated order to return all timestamps
        db.get(
          `SELECT 
            order_id,
            status,
            paid_at,
            shipped_at,
            completed_at,
            cancelled_at
          FROM Orders WHERE order_id = ?`,
          [orderId],
          (err, updatedOrder) => {
            if (err) {
              return res.json({ success: true });
            }
            res.json({ 
              success: true, 
              message: `Order status updated to ${status}`,
              order: updatedOrder
            });
          }
        );
      }
    );
  });
});

// Create new album
app.post('/api/albums', authenticateToken, requireSeller, (req, res) => {
  const { title, artist, cover_image, genre, tracklist, release_year } = req.body;
  
  db.run(
    `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [title, artist, cover_image, genre, tracklist, release_year],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        success: true, 
        album_id: this.lastID,
        message: 'Album created successfully' 
      });
    }
  );
});

// Update album
app.put('/api/albums/:id', authenticateToken, requireSeller, (req, res) => {
  const albumId = req.params.id;
  const { title, artist, cover_image, genre, tracklist, release_year } = req.body;
  
  db.run(
    `UPDATE Albums 
     SET title = ?, artist = ?, cover_image_url = ?, genre = ?, tracklist = ?, release_year = ?
     WHERE album_id = ?`,
    [title, artist, cover_image, genre, tracklist, release_year, albumId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Album updated successfully' });
    }
  );
});

// Create new product
app.post('/api/products', authenticateToken, requireSeller, (req, res) => {
  const { album_id, condition, price, description, images } = req.body;
  
  db.run(
    `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [album_id, condition, price, description, JSON.stringify(images)],
    function(err) {
      if (err) {
        console.error('Error creating product:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        success: true, 
        product_id: this.lastID,
        message: 'Product added successfully' 
      });
    }
  );
});

// Update product
app.put('/api/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  const { condition, price, description, images } = req.body;
  
  db.run(
    `UPDATE Products 
     SET condition = ?, price = ?, description = ?, image_urls = ?
     WHERE product_id = ?`,
    [condition, price, description, JSON.stringify(images), productId],
    function(err) {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Product updated successfully' });
    }
  );
});

// Delete product
app.delete('/api/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  
  // First, delete from Cart_Items (foreign key constraint)
  db.run('DELETE FROM Cart_Items WHERE product_id = ?', [productId], (err) => {
    if (err) {
      console.error('Error deleting from cart:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Then delete from Order_Items
    db.run('DELETE FROM Order_Items WHERE product_id = ?', [productId], (err) => {
      if (err) {
        console.error('Error deleting from order items:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Finally delete the product
      db.run('DELETE FROM Products WHERE product_id = ?', [productId], function(err) {
        if (err) {
          console.error('Error deleting product:', err);
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ success: true, message: 'Product deleted successfully' });
      });
    });
  });
});

// Toggle product active status
app.put('/api/products/:id/toggle', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  
  db.run(
    `UPDATE Products SET is_active = NOT is_active WHERE product_id = ?`,
    [productId],
    function(err) {
      if (err) {
        console.error('Error toggling product:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// ==================== SHIPPING ADDRESS API ====================

// Get all addresses for current user
app.get('/api/addresses', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.all(
        `SELECT * FROM Shipping_Address 
         WHERE user_id = ? 
         ORDER BY is_default DESC, created_at DESC`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Get single address
app.get('/api/addresses/:id', authenticateToken, (req, res) => {
    const addressId = req.params.id;
    const userId = req.user.userId;
    
    db.get(
        'SELECT * FROM Shipping_Address WHERE address_id = ? AND user_id = ?',
        [addressId, userId],
        (err, address) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!address) {
                return res.status(404).json({ error: 'Address not found' });
            }
            res.json(address);
        }
    );
});

// Create new address
app.post('/api/addresses', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const {
        recipient_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default = false
    } = req.body;
    
    // Validate required fields
    if (!recipient_name || !phone || !address_line1 || !city || !postal_code || !country) {
        return res.status(400).json({ 
            error: 'Recipient name, phone, address line 1, city, postal code, and country are required' 
        });
    }
    
    db.serialize(() => {
        // If this is default, unset any existing default
        if (is_default) {
            db.run(
                'UPDATE Shipping_Address SET is_default = 0 WHERE user_id = ?',
                [userId]
            );
        }
        
        db.run(
            `INSERT INTO Shipping_Address (
                user_id, recipient_name, phone, address_line1, address_line2,
                city, state, postal_code, country, is_default, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId, recipient_name, phone, address_line1, address_line2,
             city, state, postal_code, country, is_default ? 1 : 0],
            function(err) {
                if (err) {
                    console.error('Error creating address:', err);
                    return res.status(500).json({ error: err.message });
                }
                
                res.status(201).json({
                    success: true,
                    address_id: this.lastID,
                    message: 'Address created successfully'
                });
            }
        );
    });
});

// Update address
app.put('/api/addresses/:id', authenticateToken, (req, res) => {
    const addressId = req.params.id;
    const userId = req.user.userId;
    const {
        recipient_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default
    } = req.body;
    
    // First check if address belongs to user
    db.get(
        'SELECT * FROM Shipping_Address WHERE address_id = ? AND user_id = ?',
        [addressId, userId],
        (err, address) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!address) {
                return res.status(404).json({ error: 'Address not found' });
            }
            
            db.serialize(() => {
                // If setting as default, unset any existing default
                if (is_default && !address.is_default) {
                    db.run(
                        'UPDATE Shipping_Address SET is_default = 0 WHERE user_id = ?',
                        [userId]
                    );
                }
                
                db.run(
                    `UPDATE Shipping_Address 
                     SET recipient_name = ?, phone = ?, address_line1 = ?, address_line2 = ?,
                         city = ?, state = ?, postal_code = ?, country = ?, is_default = ?,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE address_id = ?`,
                    [recipient_name, phone, address_line1, address_line2,
                     city, state, postal_code, country, is_default ? 1 : 0, addressId],
                    function(err) {
                        if (err) {
                            console.error('Error updating address:', err);
                            return res.status(500).json({ error: err.message });
                        }
                        
                        res.json({
                            success: true,
                            message: 'Address updated successfully'
                        });
                    }
                );
            });
        }
    );
});

// Delete address
app.delete('/api/addresses/:id', authenticateToken, (req, res) => {
    const addressId = req.params.id;
    const userId = req.user.userId;
    
    db.run(
        'DELETE FROM Shipping_Address WHERE address_id = ? AND user_id = ?',
        [addressId, userId],
        function(err) {
            if (err) {
                console.error('Error deleting address:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Address not found' });
            }
            
            res.json({
                success: true,
                message: 'Address deleted successfully'
            });
        }
    );
});

// Get default address
app.get('/api/addresses/default/me', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.get(
        'SELECT * FROM Shipping_Address WHERE user_id = ? AND is_default = 1',
        [userId],
        (err, address) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(address || null);
        }
    );
});

// ==================== ALBUMS API ====================

// Get all albums with product counts
app.get('/api/albums', (req, res) => {
    const { genre } = req.query;
    
    let sql = `
        SELECT 
            a.album_id,
            a.title,
            a.artist,
            a.cover_image_url,
            a.genre,
            a.release_year,
            COUNT(p.product_id) as product_count,
            MIN(p.price) as min_price,
            MAX(p.price) as max_price
        FROM Albums a
        LEFT JOIN Products p ON a.album_id = p.album_id AND p.is_active = 1
    `;
    
    const params = [];
    
    if (genre) {
        sql += ' WHERE a.genre = ?';
        params.push(genre);
    }
    
    sql += ' GROUP BY a.album_id ORDER BY a.created_at DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get single album
app.get('/api/albums/:id', (req, res) => {
    const albumId = req.params.id;
    
    db.get(
        `SELECT 
            album_id,
            title,
            artist,
            cover_image_url,
            genre,
            tracklist,
            release_year,
            created_at
        FROM Albums
        WHERE album_id = ?`,
        [albumId],
        (err, album) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            if (!album) {
                return res.status(404).json({ error: 'Album not found' });
            }
            res.json(album);
        }
    );
});

// Get album with all its products
app.get('/api/albums/:id/with-products', (req, res) => {
    const albumId = req.params.id;
    
    db.get(
        `SELECT * FROM Albums WHERE album_id = ?`,
        [albumId],
        (err, album) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!album) {
                return res.status(404).json({ error: 'Album not found' });
            }
            
            db.all(
                `SELECT 
                    product_id as id,
                    condition,
                    price,
                    description,
                    image_urls
                FROM Products 
                WHERE album_id = ? AND is_active = 1
                ORDER BY 
                    CASE condition
                        WHEN 'Mint' THEN 1
                        WHEN 'Near Mint' THEN 2
                        WHEN 'Good' THEN 3
                        ELSE 4
                    END,
                    price DESC`,
                [albumId],
                (err, products) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({
                        ...album,
                        products: products || []
                    });
                }
            );
        }
    );
});

// Get products by album ID
app.get('/api/albums/:id/products', (req, res) => {
  const albumId = req.params.id;
  
  db.all(
    `SELECT 
      product_id as id,
      condition,
      price,
      description,
      image_urls,
      is_active
    FROM Products
    WHERE album_id = ?
    ORDER BY 
      CASE condition
        WHEN 'Mint' THEN 1
        WHEN 'Near Mint' THEN 2
        WHEN 'Good' THEN 3
        ELSE 4
      END`,
    [albumId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Products from DB with images:', rows); // Debug log
      res.json(rows);
    }
  );
});

// Get featured albums (most products)
app.get('/api/albums/featured', (req, res) => {
    const { limit = 10 } = req.query;
    
    const sql = `
        SELECT 
            a.album_id,
            a.title,
            a.artist,
            a.cover_image_url,
            a.genre,
            a.release_year,
            COUNT(p.product_id) as product_count
        FROM Albums a
        LEFT JOIN Products p ON a.album_id = p.album_id AND p.is_active = 1
        GROUP BY a.album_id
        HAVING product_count > 0
        ORDER BY product_count DESC, a.created_at DESC
        LIMIT ?
    `;
    
    db.all(sql, [parseInt(limit)], (err, rows) => {
        if (err) {
            console.error('Error fetching featured albums:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get new arrivals
app.get('/api/albums/new', (req, res) => {
    const { limit = 10 } = req.query;
    
    const sql = `
        SELECT 
            a.album_id,
            a.title,
            a.artist,
            a.cover_image_url,
            a.genre,
            a.release_year,
            COUNT(p.product_id) as product_count
        FROM Albums a
        LEFT JOIN Products p ON a.album_id = p.album_id AND p.is_active = 1
        GROUP BY a.album_id
        ORDER BY a.created_at DESC
        LIMIT ?
    `;
    
    db.all(sql, [parseInt(limit)], (err, rows) => {
        if (err) {
            console.error('Error fetching new arrivals:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Search albums
app.get('/api/albums/search', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.json([]);
    }
    
    const sql = `
        SELECT 
            album_id,
            title,
            artist,
            cover_image_url,
            genre,
            release_year
        FROM Albums
        WHERE title LIKE ? OR artist LIKE ?
        ORDER BY 
            CASE 
                WHEN title LIKE ? THEN 1
                WHEN artist LIKE ? THEN 2
                ELSE 3
            END
        LIMIT 20
    `;
    
    const searchTerm = `%${q}%`;
    const params = [searchTerm, searchTerm, `%${q}%`, `%${q}%`];
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Search error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get album statistics
app.get('/api/albums/:id/stats', (req, res) => {
    const albumId = req.params.id;
    
    db.get(
        `SELECT 
            COUNT(*) as total_products,
            MIN(price) as min_price,
            MAX(price) as max_price,
            AVG(price) as avg_price
        FROM Products
        WHERE album_id = ? AND is_active = 1`,
        [albumId],
        (err, stats) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            db.all(
                `SELECT condition, COUNT(*) as count
                FROM Products
                WHERE album_id = ? AND is_active = 1
                GROUP BY condition`,
                [albumId],
                (err, conditions) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    const conditionCounts = {};
                    conditions.forEach(c => {
                        conditionCounts[c.condition] = c.count;
                    });
                    
                    res.json({
                        ...stats,
                        conditions: conditionCounts
                    });
                }
            );
        }
    );
});

// Get album with price range
app.get('/api/albums/:id/with-price-range', (req, res) => {
    const albumId = req.params.id;
    
    db.get(
        `SELECT 
            a.*,
            MIN(p.price) as min_price,
            MAX(p.price) as max_price,
            COUNT(p.product_id) as total_products
        FROM Albums a
        LEFT JOIN Products p ON a.album_id = p.album_id AND p.is_active = 1
        WHERE a.album_id = ?
        GROUP BY a.album_id`,
        [albumId],
        (err, album) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!album) {
                return res.status(404).json({ error: 'Album not found' });
            }
            res.json(album);
        }
    );
});

// ==================== SELLER REPORTS ====================

// Feature 1: Total weekly sales trend (all albums combined)
app.get('/api/seller/reports/total-trend', authenticateToken, requireSeller, (req, res) => {
  let weeks = parseInt(req.query.weeks);
  if (isNaN(weeks)) weeks = 12;
  weeks = Math.max(Math.min(weeks, 52), 4);
  const days = weeks * 7;

  console.log(`Total trend: weeks=${weeks}, days=${days}`);

  // First, get cutoff date string
  const dateFilter = `-${days} days`;
  console.log('Date filter:', dateFilter);

  const query = `
    SELECT
      strftime('%Y-%W', o.created_at) as week,
      date(o.created_at, '-' || strftime('%w', o.created_at) || ' days') as week_start,
      date(o.created_at, '+' || (6 - strftime('%w', o.created_at)) || ' days') as week_end,
      COUNT(oi.order_item_id) as units_sold,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price_at_purchase) as revenue,
      COUNT(DISTINCT o.order_id) as orders
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND o.created_at >= date('now', '${dateFilter}')
    GROUP BY week
    ORDER BY week ASC
  `;

  console.log('Total trend query:', query);

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching total trend:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Total trend result rows:', rows.length);
    console.log('Total trend result data:', rows);
    res.json({ success: true, data: rows });
  });
});

// Feature 2: Weekly sales comparison by genre
app.get('/api/seller/reports/genre-weekly', authenticateToken, requireSeller, (req, res) => {
  let weeks = parseInt(req.query.weeks);
  if (isNaN(weeks)) weeks = 12;
  weeks = Math.max(Math.min(weeks, 52), 4);
  const days = weeks * 7;

  console.log(`Genre weekly: weeks=${weeks}, days=${days}`);

  const dateFilter = `-${days} days`;
  console.log('Date filter:', dateFilter);

  const query = `
    SELECT
      strftime('%Y-%W', o.created_at) as week,
      date(o.created_at, '-' || strftime('%w', o.created_at) || ' days') as week_start,
      date(o.created_at, '+' || (6 - strftime('%w', o.created_at)) || ' days') as week_end,
      a.genre,
      COUNT(oi.order_item_id) as units_sold,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price_at_purchase) as revenue
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    JOIN Products p ON oi.product_id = p.product_id
    JOIN Albums a ON p.album_id = a.album_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND o.created_at >= date('now', '${dateFilter}')
      AND a.genre IS NOT NULL
      AND a.genre != ''
    GROUP BY week, a.genre
    ORDER BY week ASC, a.genre
  `;

  console.log('Genre weekly query:', query);

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching genre weekly data:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Genre weekly result rows:', rows.length);
    console.log('Genre weekly result data:', rows);
    res.json({ success: true, data: rows });
  });
});

// Feature 3: Weekly sales for specific albums
app.get('/api/seller/reports/album-weekly', authenticateToken, requireSeller, (req, res) => {
  let weeks = parseInt(req.query.weeks);
  if (isNaN(weeks)) weeks = 12;
  weeks = Math.max(Math.min(weeks, 52), 4);
  const days = weeks * 7;
  const albumId = req.query.album_id ? parseInt(req.query.album_id) : null;

  console.log(`Album weekly: weeks=${weeks}, days=${days}, albumId=${albumId}`);

  const dateFilter = `-${days} days`;
  console.log('Date filter:', dateFilter);

  let query = `
    SELECT
      strftime('%Y-%W', o.created_at) as week,
      date(o.created_at, '-' || strftime('%w', o.created_at) || ' days') as week_start,
      date(o.created_at, '+' || (6 - strftime('%w', o.created_at)) || ' days') as week_end,
      a.album_id,
      a.title,
      a.artist,
      COUNT(oi.order_item_id) as units_sold,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price_at_purchase) as revenue
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    JOIN Products p ON oi.product_id = p.product_id
    JOIN Albums a ON p.album_id = a.album_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND o.created_at >= date('now', '${dateFilter}')
  `;

  const params = [];
  if (albumId) {
    query += ` AND a.album_id = ?`;
    params.push(albumId);
  }

  query += `
    GROUP BY week, a.album_id
    ORDER BY week ASC, a.title
  `;

  console.log('Album weekly query:', query);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching album weekly data:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Album weekly result rows:', rows.length);
    console.log('Album weekly result data:', rows);
    res.json({ success: true, data: rows });
  });
});

// Feature 4: Weekly sales for products within albums
app.get('/api/seller/reports/product-weekly', authenticateToken, requireSeller, (req, res) => {
  let weeks = parseInt(req.query.weeks);
  if (isNaN(weeks)) weeks = 12;
  weeks = Math.max(Math.min(weeks, 52), 4);
  const days = weeks * 7;
  const albumId = req.query.album_id ? parseInt(req.query.album_id) : null;

  console.log(`Product weekly: weeks=${weeks}, days=${days}, albumId=${albumId}`);

  const dateFilter = `-${days} days`;
  console.log('Date filter:', dateFilter);

  let query = `
    SELECT
      strftime('%Y-%W', o.created_at) as week,
      date(o.created_at, '-' || strftime('%w', o.created_at) || ' days') as week_start,
      date(o.created_at, '+' || (6 - strftime('%w', o.created_at)) || ' days') as week_end,
      p.product_id,
      p.condition,
      p.price,
      a.album_id,
      a.title as album_title,
      a.artist,
      COUNT(oi.order_item_id) as units_sold,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price_at_purchase) as revenue
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    JOIN Products p ON oi.product_id = p.product_id
    JOIN Albums a ON p.album_id = a.album_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND o.created_at >= date('now', '${dateFilter}')
  `;

  const params = [];
  if (albumId) {
    query += ` AND a.album_id = ?`;
    params.push(albumId);
  }

  query += `
    GROUP BY week, p.product_id
    ORDER BY week ASC, a.title, p.condition
  `;

  console.log('Product weekly query:', query);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching product weekly data:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Product weekly result rows:', rows.length);
    console.log('Product weekly result data:', rows);
    res.json({ success: true, data: rows });
  });
});

// Helper endpoint to get list of all albums (for dropdowns)
app.get('/api/seller/reports/albums', authenticateToken, requireSeller, (req, res) => {
  const query = `
    SELECT
      a.album_id,
      a.title,
      a.artist,
      a.genre,
      COUNT(DISTINCT p.product_id) as product_count,
      MIN(p.price) as min_price,
      MAX(p.price) as max_price
    FROM Albums a
    LEFT JOIN Products p ON a.album_id = p.album_id
    WHERE p.is_active = 1 OR p.product_id IS NULL
    GROUP BY a.album_id
    ORDER BY a.title
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching albums list:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

// Debug endpoint to check orders
app.get('/api/seller/reports/debug-orders', authenticateToken, requireSeller, (req, res) => {
  // First, let's check the date calculation
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);
  console.log('Debug: Checking orders since:', cutoffDate.toISOString());

  const query = `
    SELECT
      o.order_id,
      o.status,
      o.created_at,
      o.total_amount,
      COUNT(oi.order_item_id) as item_count
    FROM Orders o
    LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
    WHERE o.created_at >= date('now', '-365 days')
    GROUP BY o.order_id
    ORDER BY o.created_at DESC
    LIMIT 20
  `;

  console.log('Debug orders query:', query);

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching debug orders:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Debug orders:', rows);
    console.log('Debug orders count:', rows.length);

    // Also test a simpler query to count all completed orders
    const simpleQuery = `
      SELECT COUNT(*) as count, status
      FROM Orders
      WHERE status IN ('paid', 'shipped', 'completed')
      GROUP BY status
    `;
    db.all(simpleQuery, [], (err2, statusRows) => {
      if (err2) {
        console.error('Error fetching status count:', err2);
      } else {
        console.log('Orders by status:', statusRows);
      }
    });

    res.json({ success: true, data: rows });
  });
});

// Simple test endpoint to verify query works
app.get('/api/seller/reports/test-query', authenticateToken, requireSeller, (req, res) => {
  // Test 1: Simple query for completed orders in last 90 days
  const simpleQuery = `
    SELECT COUNT(*) as count
    FROM Orders o
    WHERE o.status = 'completed'
      AND o.created_at >= date('now', '-90 days')
  `;

  db.get(simpleQuery, [], (err, row) => {
    if (err) {
      console.error('Error in test query:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Test 1 - Completed orders in 90 days:', row);

    // Test 2: Query with JOIN
    const joinQuery = `
      SELECT COUNT(*) as count
      FROM Orders o
      JOIN Order_Items oi ON o.order_id = oi.order_id
      WHERE o.status = 'completed'
        AND o.created_at >= date('now', '-90 days')
    `;

    db.get(joinQuery, [], (err2, row2) => {
      if (err2) {
        console.error('Error in join query:', err2);
        return res.status(500).json({ error: err2.message });
      }
      console.log('Test 2 - Completed orders with JOIN:', row2);

      res.json({
        success: true,
        test1: row,
        test2: row2
      });
    });
  });
});

// Weekly comparison API: Current week vs previous week
app.get('/api/seller/reports/weekly-comparison', authenticateToken, requireSeller, (req, res) => {
  try {
    let weeks = parseInt(req.query.weeks);
    if (isNaN(weeks)) weeks = 12;
    weeks = Math.max(Math.min(weeks, 52), 4);
    const days = weeks * 7;

    console.log(`Weekly comparison: weeks=${weeks}, days=${days}`);

    // First, check if Orders and Order_Items tables exist and have data
    db.get("SELECT COUNT(*) as count FROM Orders WHERE status IN ('paid', 'shipped', 'completed')", [], (err, orderRow) => {
      if (err) {
        console.error('Error checking Orders table:', err);
        return res.status(500).json({ error: 'Orders table error: ' + err.message });
      }
      console.log('Completed/paid/shipped orders count:', orderRow.count);

      db.get("SELECT COUNT(*) as count FROM Order_Items", [], (err, itemRow) => {
        if (err) {
          console.error('Error checking Order_Items table:', err);
          return res.status(500).json({ error: 'Order_Items table error: ' + err.message });
        }
        console.log('Order items count:', itemRow.count);

        // Now run the main query for total sales
        const query = `
          SELECT
            strftime('%Y-%W', o.created_at) as week,
            COUNT(oi.order_item_id) as units_sold,
            SUM(oi.quantity * oi.price_at_purchase) as revenue
          FROM Orders o
          JOIN Order_Items oi ON o.order_id = oi.order_id
          WHERE o.status IN ('paid', 'shipped', 'completed')
            AND o.created_at >= date('now', '-' || ${days} || ' days')
          GROUP BY week
          ORDER BY week ASC
        `;

        console.log('Weekly comparison query:', query);

        // Query for genre-level data
        const genreQuery = `
          SELECT
            a.genre,
            strftime('%Y-%W', o.created_at) as week,
            COUNT(oi.order_item_id) as units_sold,
            SUM(oi.quantity * oi.price_at_purchase) as revenue
          FROM Orders o
          JOIN Order_Items oi ON o.order_id = oi.order_id
          JOIN Products p ON oi.product_id = p.product_id
          JOIN Albums a ON p.album_id = a.album_id
          WHERE o.status IN ('paid', 'shipped', 'completed')
            AND o.created_at >= date('now', '-' || ${days} || ' days')
            AND a.genre IS NOT NULL
          GROUP BY a.genre, week
          ORDER BY a.genre, week ASC
        `;

        console.log('Genre comparison query:', genreQuery);

        // Query for album sales ranking (current week only)
        const albumRankingQuery = `
          SELECT
            a.album_id,
            a.title,
            a.artist,
            a.cover_image_url,
            COUNT(oi.order_item_id) as units_sold,
            SUM(oi.quantity * oi.price_at_purchase) as revenue
          FROM Orders o
          JOIN Order_Items oi ON o.order_id = oi.order_id
          JOIN Products p ON oi.product_id = p.product_id
          JOIN Albums a ON p.album_id = a.album_id
          WHERE o.status IN ('paid', 'shipped', 'completed')
            AND o.created_at >= date('now', '-' || '7' || ' days')
          GROUP BY a.album_id
          ORDER BY units_sold DESC, revenue DESC
          LIMIT 10
        `;

        console.log('Album ranking query:', albumRankingQuery);

        // Query for product condition analysis (current week only)
        const conditionAnalysisQuery = `
          SELECT
            p.condition,
            p.product_id,
            a.title,
            a.artist,
            a.cover_image_url,
            COUNT(oi.order_item_id) as units_sold,
            SUM(oi.quantity * oi.price_at_purchase) as revenue
          FROM Orders o
          JOIN Order_Items oi ON o.order_id = oi.order_id
          JOIN Products p ON oi.product_id = p.product_id
          JOIN Albums a ON p.album_id = a.album_id
          WHERE o.status IN ('paid', 'shipped', 'completed')
            AND o.created_at >= date('now', '-' || '7' || ' days')
          GROUP BY p.condition
          ORDER BY units_sold DESC
        `;

        console.log('Condition analysis query:', conditionAnalysisQuery);

        db.all(query, [], (err, rows) => {
          if (err) {
            console.error('Error fetching weekly comparison:', err);
            console.error('Error stack:', err.stack);
            return res.status(500).json({ error: err.message });
          }

          console.log('Weekly comparison query returned rows:', rows.length);
          console.log('Query result:', JSON.stringify(rows, null, 2));

          if (!rows || rows.length === 0) {
            console.log('No orders found in date range');
            return res.json({ success: true, data: { currentWeek: null, previousWeek: null, comparison: null, genreComparison: [] } });
          }

          // Since rows are ordered by week ASC, the last row is the most recent week (current week)
          // The second-to-last row is the previous week
          const currentWeek = rows[rows.length - 1] || {};
          const previousWeek = rows.length > 1 ? rows[rows.length - 2] : null;

          // Calculate comparison
          const comparison = {
            current: {
              units_sold: currentWeek.units_sold || 0,
              revenue: currentWeek.revenue || 0
            },
            previous: {
              units_sold: previousWeek?.units_sold || 0,
              revenue: previousWeek?.revenue || 0
            }
          };

          if (previousWeek && previousWeek.units_sold > 0) {
            comparison.unitsSoldChange = Math.round(((currentWeek.units_sold - previousWeek.units_sold) / previousWeek.units_sold) * 100);
            comparison.revenueChange = Math.round(((currentWeek.revenue - previousWeek.revenue) / previousWeek.revenue) * 100);
          } else {
            comparison.unitsSoldChange = 0;
            comparison.revenueChange = 0;
          }

          console.log('Weekly comparison result:', comparison);
          console.log('Current week:', currentWeek);
          console.log('Previous week:', previousWeek);

          // Fetch genre-level data
          db.all(genreQuery, [], (genreErr, genreRows) => {
            if (genreErr) {
              console.error('Error fetching genre comparison:', genreErr);
              return res.status(500).json({ error: genreErr.message });
            }

            console.log('Genre comparison query returned rows:', genreRows.length);

            const genreMap = new Map();
            genreRows.forEach(row => {
              if (!genreMap.has(row.genre)) {
                genreMap.set(row.genre, {
                  genre: row.genre,
                  weeks: []
                });
              }
              genreMap.get(row.genre).weeks.push(row);
            });

            // Calculate genre comparisons
            const genreComparison = [];
            genreMap.forEach(genreData => {
              const weeks = genreData.weeks;
              const currentWeekData = weeks[weeks.length - 1];
              const previousWeekData = weeks.length > 1 ? weeks[weeks.length - 2] : null;

              const result = {
                genre_name: genreData.genre,
                current: {
                  units_sold: currentWeekData.units_sold || 0,
                  revenue: currentWeekData.revenue || 0
                },
                previous: {
                  units_sold: previousWeekData?.units_sold || 0,
                  revenue: previousWeekData?.revenue || 0
                }
              };

              if (previousWeekData && previousWeekData.units_sold > 0) {
                result.unitsSoldChange = Math.round(((currentWeekData.units_sold - previousWeekData.units_sold) / previousWeekData.units_sold) * 100);
              } else {
                result.unitsSoldChange = 0;
              }

              if (previousWeekData && previousWeekData.revenue > 0) {
                result.revenueChange = Math.round(((currentWeekData.revenue - previousWeekData.revenue) / previousWeekData.revenue) * 100);
              } else {
                result.revenueChange = 0;
              }

              genreComparison.push(result);
            });

            // Fetch album ranking data
            db.all(albumRankingQuery, [], (albumErr, albumRows) => {
              if (albumErr) {
                console.error('Error fetching album ranking:', albumErr);
                return res.status(500).json({ error: albumErr.message });
              }

              console.log('Album ranking query returned rows:', albumRows.length);

              // Get best selling (top 3) and worst selling (bottom 3)
              const albumRanking = {
                bestSelling: albumRows.slice(0, 3),
                worstSelling: albumRows.length > 3 ? albumRows.slice(-3).reverse() : [],
                allSorted: albumRows // Full sorted list for dropdown selection
              };

              // Fetch condition analysis data
              db.all(conditionAnalysisQuery, [], (conditionErr, conditionRows) => {
                if (conditionErr) {
                  console.error('Error fetching condition analysis:', conditionErr);
                  return res.status(500).json({ error: conditionErr.message });
                }

                console.log('Condition analysis query returned rows:', conditionRows.length);

                // Group by condition
                const conditionAnalysis = {
                  Mint: null,
                  'Near Mint': null,
                  'Good': null
                };

                conditionRows.forEach(row => {
                  if (conditionAnalysis.hasOwnProperty(row.condition)) {
                    conditionAnalysis[row.condition] = {
                      condition: row.condition,
                      units_sold: row.units_sold,
                      revenue: row.revenue
                    };
                  }
                });

                res.json({ success: true, data: { currentWeek, previousWeek, comparison, genreComparison, albumRanking, conditionAnalysis } });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Unexpected error in weekly comparison:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Test API to verify basic functionality
app.get('/api/seller/reports/test-comparison', authenticateToken, requireSeller, (req, res) => {
  console.log('Test comparison API called');
  res.json({
    success: true,
    data: {
      currentWeek: { units_sold: 100, revenue: 5000 },
      previousWeek: { units_sold: 80, revenue: 4000 },
      comparison: {
        current: { units_sold: 100, revenue: 5000 },
        previous: { units_sold: 80, revenue: 4000 },
        unitsSoldChange: 25,
        revenueChange: 25
      }
    }
  });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` API endpoints:`);
    console.log(`   - POST /api/users/login`);
    console.log(`   - GET /api/products`);
    console.log(`   - GET /api/products/:id`);
    console.log(`   - GET /api/cart (protected)`);
    console.log(`   - POST /api/cart/add (protected)`);
    console.log(`   - PUT /api/cart/update (protected)`);
    console.log(`   - DELETE /api/cart/remove/:id (protected)`);
    console.log(`   - GET /api/cart/summary (protected)`);
    console.log(`   - GET /api/forum/messages`);
    console.log(`   - POST /api/forum/messages (protected)`);
    console.log(`   - GET /api/health`);
});