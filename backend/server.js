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

// Delete product
app.delete('/api/products/:id', authenticateToken, requireSeller, (req, res) => {
  const productId = req.params.id;
  
  // First check if product exists and get its album_id
  db.get('SELECT * FROM Products WHERE product_id = ?', [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if product is in any cart or order
    db.get('SELECT COUNT(*) as count FROM Cart_Items WHERE product_id = ?', [productId], (err, cartResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT COUNT(*) as count FROM Order_Items WHERE product_id = ?', [productId], (err, orderResult) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // If product is in cart or orders, prevent deletion
        if (cartResult.count > 0 || orderResult.count > 0) {
          return res.status(400).json({ 
            error: 'Cannot delete product that is in carts or orders. Deactivate it instead.' 
          });
        }
        
        // Delete the product
        db.run('DELETE FROM Products WHERE product_id = ?', [productId], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ 
            success: true, 
            message: 'Product deleted successfully' 
          });
        });
      });
    });
  });
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
        p.condition
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
      res.json(items || []);
    }
  );
});

// Add to cart (always quantity 1) - Updated with seller check
app.post('/api/cart/add', authenticateToken, (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;
  
  // Check if product exists and get its seller info
  db.get(
    `SELECT p.*, a.title as album_title 
     FROM Products p
     JOIN Albums a ON p.album_id = a.album_id
     WHERE p.product_id = ?`,
    [product_id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Prevent sellers from buying (sellers can't purchase)
      if (userRole === 'seller' || userRole === 'admin') {
        return res.status(403).json({ 
          error: 'Sellers cannot purchase products' 
        });
      }
      
      // Check if already in cart
      db.get(
        'SELECT * FROM Cart_Items WHERE user_id = ? AND product_id = ?',
        [userId, product_id],
        (err, existingItem) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (existingItem) {
            // Product already in cart - don't add duplicate
            return res.status(400).json({ error: 'Item already in cart' });
          }
          
          // Add new item with quantity 1
          db.run(
            'INSERT INTO Cart_Items (user_id, product_id, quantity) VALUES (?, ?, 1)',
            [userId, product_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ success: true, message: 'Item added to cart' });
            }
          );
        }
      );
    }
  );
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
  const { username, email, password } = req.body;
  
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
        
        // Always insert as 'customer' role
        db.run(
          'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [username, email, hashedPassword, 'customer'],
          function(err) {
            if (err) {
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
        res.status(500).json({ error: error.message });
      }
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
// Get products by album ID
app.get('/api/albums/:id/products', (req, res) => {
  const albumId = req.params.id;
  
  db.all(
    `SELECT 
      product_id as id,
      condition,
      price,
      description,
      image_urls  
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