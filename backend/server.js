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
app.use(express.json());

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
                    message: '用户名或密码错误' 
                });
            }
            
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.json({ 
                    success: false, 
                    message: '用户名或密码错误' 
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

// Get seller's product by product_id
app.get('/api/seller/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;

  db.get(
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
        p.is_active
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
      // Filter out inactive products
      const activeItems = (items || []).filter(item => item.is_active === 1);
      res.json(activeItems);
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

// Get cart summary
app.get('/api/cart/summary', authenticateToken, (req, res) => {
  db.get(
    `SELECT 
        COUNT(*) as count
    FROM Cart_Items ci
    JOIN Products p ON ci.product_id = p.product_id
    WHERE ci.user_id = ? AND p.is_active = 1`,
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
        WHERE ci.user_id = ?`,
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

// Get user's orders
app.get('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at as date,
      o.shipping_address,
      o.payment_method,
      o.transaction_id,
      o.paid_at
    FROM Orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Get items for each order
      const ordersWithItems = orders.map(order => {
        return new Promise((resolve, reject) => {
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
            [order.id],
            (err, items) => {
              if (err) reject(err);
              
              // DON'T filter out orders - show all orders
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

// Get single order for user
app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;
  
  db.get(
    `SELECT 
      o.order_id as id,
      o.total_amount as total,
      o.status,
      o.created_at,
      o.shipping_address,
      o.payment_method,
      o.transaction_id,
      o.paid_at
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
          
          // Calculate subtotal (items total before shipping)
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          // Shipping is free over 500, otherwise 50
          const shipping = subtotal >= 500 ? 0 : 50;
          
          res.json({
            ...order,
            items: items || [],
            subtotal,
            shipping_cost: shipping,
            total: order.total // total_amount from database already includes shipping
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

// Get seller dashboard data (protected - requires seller role)
app.get('/api/seller/dashboard', authenticateToken, (req, res) => {
  // Check if user is seller
  db.get(
    'SELECT role FROM Users WHERE user_id = ?',
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user || user.role !== 'seller') {
        return res.status(403).json({ error: 'Access denied. Seller role required.' });
      }

      // Get seller statistics
      db.get(
        `SELECT
            (SELECT COUNT(*) FROM Products WHERE is_active = 1) as total_products,
            (SELECT COUNT(DISTINCT album_id) FROM Products WHERE is_active = 1) as total_albums,
            (SELECT COUNT(*) FROM Orders WHERE status = 'pending') as pending_orders,
            (SELECT COUNT(*) FROM Orders WHERE status = 'paid') as paid_orders,
            (SELECT COUNT(*) FROM Orders WHERE status = 'completed') as completed_orders`,
        [req.user.userId],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get recent orders
          db.all(
            `SELECT
                o.order_id,
                o.total_amount,
                o.status,
                o.created_at,
                o.paid_at,
                u.username as customer_name,
                COUNT(oi.order_item_id) as item_count
            FROM Orders o
            JOIN Users u ON o.user_id = u.user_id
            LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
            LIMIT 10`,
            [req.user.userId],
            (err, recentOrders) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Get low stock products
              db.all(
                `SELECT
                    p.product_id,
                    a.title AS album_title,
                    a.artist,
                    a.cover_image_url,
                    p.condition,
                    p.price,
                    p.is_active
                FROM Products p
                JOIN Albums a ON p.album_id = a.album_id
                WHERE p.is_active = 1
                ORDER BY p.created_at ASC
                LIMIT 10`,
                [],
                (err, lowStock) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  res.json({
                    stats: stats || {},
                    recentOrders: recentOrders || [],
                    lowStock: lowStock || [],
                    sellerInfo: {
                      userId: req.user.userId,
                      username: user.username,
                      email: user.email
                    }
                  });
                }
              );
            }
          );
        }
      );
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

// ==================== HEALTH CHECK ====================
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