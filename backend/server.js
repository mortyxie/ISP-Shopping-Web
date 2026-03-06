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

// ==================== FORGOT PASSWORD API ====================
// Simple password reset (for development - no email sending)
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

      if (!user) {
        // For security, don't reveal if email exists
        return res.json({
          success: true,
          message: '如果该邮箱已注册，重置密码链接已发送到您的邮箱'
        });
      }

      // For development: return a temporary reset code
      // In production, you would send an email with a reset link
      const tempCode = 'TEMP-' + Date.now();
      console.log(`Password reset for user ${user.username} (${email}): ${tempCode}`);

      res.json({
        success: true,
        message: '重置密码链接已生成（开发环境，请查看下方临时码）',
        // 前端可以用这个码直接访问重设页面
        resetCode: tempCode,
        tempLink: `http://localhost:5173/reset-password?email=${email}&code=${tempCode}`
      });
    }
  );
});

// Reset password (for development)
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword, code } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '邮箱和新密码不能为空'
    });
  }

  // 验证重置码（开发环境）
  if (!code) {
    return res.status(400).json({
      success: false,
      message: '请输入重置码'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '密码至少需要6个字符'
    });
  }

  // Check if user exists and validate code
  db.get(
    'SELECT * FROM Users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      try {
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        db.run(
          'UPDATE Users SET password_hash = ? WHERE user_id = ?',
          [hashedPassword, user.user_id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              success: true,
              message: '密码重置成功，请使用新密码登录'
            });
          }
        );
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
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

app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    
    // Make sure productId is a number
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    db.get(
        `SELECT 
            p.product_id as id,
            a.title as name,
            a.artist,
            a.cover_image_url as image,
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
                console.error('Database error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
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

// Add to cart (always quantity 1)
app.post('/api/cart/add', authenticateToken, (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.userId;
  
  // Check if product exists
  db.get('SELECT * FROM Products WHERE product_id = ?', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
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
app.get('/api/albums/:id/products', (req, res) => {
    const albumId = req.params.id;
    
    db.all(
        `SELECT 
            product_id as id,
            condition,
            price,
            description
        FROM Products
        WHERE album_id = ? AND is_active = 1
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