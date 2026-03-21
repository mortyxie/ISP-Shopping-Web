// backend/database/seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'record_store.db'));

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        // Clear existing data
        await runQuery('PRAGMA foreign_keys = OFF');
        await runQuery('DELETE FROM Cart_Items');
        await runQuery('DELETE FROM Order_Items');
        await runQuery('DELETE FROM Orders');
        await runQuery('DELETE FROM Reviews');
        await runQuery('DELETE FROM Discussion_Bubbles');
        await runQuery('DELETE FROM Products');
        await runQuery('DELETE FROM Albums');
        await runQuery('DELETE FROM Shipping_Address');
        await runQuery('DELETE FROM Users');
        await runQuery('PRAGMA foreign_keys = ON');
        
        console.log('✅ Database cleared');
        
        // Insert Users
        await runQuery(
            'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['user1', 'user1@example.com', hashedPassword, 'customer']
        );
        await runQuery(
            'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['user2', 'user2@example.com', hashedPassword, 'customer']
        );
        await runQuery(
            'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['seller', 'seller@example.com', hashedPassword, 'admin']
        );
        
        console.log('✅ Users inserted');
        
        // Get user IDs
        const users = await allQuery('SELECT user_id, username FROM Users');
        const user1 = users.find(u => u.username === 'user1');
        const user2 = users.find(u => u.username === 'user2');
        const seller = users.find(u => u.username === 'seller');
        
        // Insert Albums
        await runQuery(
            `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            ['Abbey Road', 'The Beatles', 'https://picsum.photos/id/100/300/300', 'Rock', '1. Come Together\n2. Something\n3. Here Comes the Sun', 1969]
        );
        await runQuery(
            `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            ['Thriller', 'Michael Jackson', 'https://picsum.photos/id/101/300/300', 'Pop', '1. Wanna Be Startin Something\n2. Thriller\n3. Beat It', 1982]
        );
        await runQuery(
            `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            ['Kind of Blue', 'Miles Davis', 'https://picsum.photos/id/102/300/300', 'Jazz', '1. So What\n2. Freddie Freeloader\n3. Blue in Green', 1959]
        );
        
        console.log('✅ Albums inserted');
        
        // Get album IDs
        const albums = await allQuery('SELECT album_id, title FROM Albums');
        const abbeyRoad = albums.find(a => a.title === 'Abbey Road');
        const thriller = albums.find(a => a.title === 'Thriller');
        const kindOfBlue = albums.find(a => a.title === 'Kind of Blue');
        
        // Insert Products
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [abbeyRoad.album_id, 'Mint', 299.99, 'Perfect condition, sealed', '["https://picsum.photos/id/100/300/300"]']
        );
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [abbeyRoad.album_id, 'Near Mint', 199.99, 'Almost perfect', '["https://picsum.photos/id/100/300/300"]']
        );
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [abbeyRoad.album_id, 'Good', 99.99, 'Some scratches, plays well', '["https://picsum.photos/id/100/300/300"]']
        );
        
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [thriller.album_id, 'Mint', 249.99, 'Sealed, perfect', '["https://picsum.photos/id/101/300/300"]']
        );
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [thriller.album_id, 'Near Mint', 159.99, 'Excellent condition', '["https://picsum.photos/id/101/300/300"]']
        );
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [thriller.album_id, 'Good', 79.99, 'Light scratches', '["https://picsum.photos/id/101/300/300"]']
        );
        
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [kindOfBlue.album_id, 'Mint', 349.99, 'Rare pressing', '["https://picsum.photos/id/102/300/300"]']
        );
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [kindOfBlue.album_id, 'Near Mint', 249.99, 'Great condition', '["https://picsum.photos/id/102/300/300"]']
        );
        await runQuery(
            `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [kindOfBlue.album_id, 'Good', 149.99, 'Some wear, plays beautifully', '["https://picsum.photos/id/102/300/300"]']
        );
        
        console.log('✅ Products inserted');
        
        // Get product IDs
        const products = await allQuery('SELECT product_id FROM Products ORDER BY product_id');
        
        // Insert Orders
        await runQuery(
            `INSERT INTO Orders (user_id, total_amount, status, shipping_address, payment_method, paid_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user1.user_id, 299.99, 'completed', 'Beijing, China', 'Credit Card', daysAgoIso(15), daysAgoIso(20)]
        );
        await runQuery(
            `INSERT INTO Orders (user_id, total_amount, status, shipping_address, payment_method, paid_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user1.user_id, 79.99, 'shipped', 'Beijing, China', 'Credit Card', daysAgoIso(5), daysAgoIso(10)]
        );
        await runQuery(
            `INSERT INTO Orders (user_id, total_amount, status, shipping_address, payment_method, paid_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user2.user_id, 249.99, 'paid', 'Shenzhen, China', 'PayPal', daysAgoIso(2), daysAgoIso(7)]
        );
        
        console.log('✅ Orders inserted');
        
        // Get order IDs
        const orders = await allQuery('SELECT order_id FROM Orders ORDER BY order_id');
        
        // Insert Order Items
        await runQuery(
            'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)',
            [orders[0].order_id, products[0].product_id, 299.99]
        );
        await runQuery(
            'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)',
            [orders[1].order_id, products[5].product_id, 79.99]
        );
        await runQuery(
            'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)',
            [orders[2].order_id, products[7].product_id, 249.99]
        );
        
        console.log('✅ Order items inserted');
        
        // Insert Reviews - CHANGE merchant_reply to be valid JSON
        await runQuery(
            `INSERT INTO Reviews (user_id, product_id, rating, comment, merchant_reply, reply_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user1.user_id, products[0].product_id, 5, '音质很棒，包装也很用心，成色几乎全新！', JSON.stringify({ content: '感谢支持！祝听得开心～' }), daysAgoIso(10), daysAgoIso(11)]
        );

        await runQuery(
            `INSERT INTO Reviews (user_id, product_id, rating, comment, merchant_reply, reply_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user1.user_id, products[5].product_id, 4, '整体不错，发货很快。', null, null, daysAgoIso(5)]
        );

        await runQuery(
            `INSERT INTO Reviews (user_id, product_id, rating, comment, merchant_reply, reply_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user2.user_id, products[7].product_id, 5, '经典专辑！收到就立刻开听，太棒了！', JSON.stringify({ content: '喜欢就好～欢迎常来！' }), daysAgoIso(3), daysAgoIso(4)]
        );
        
        console.log('✅ Reviews inserted');
        
        // Insert Shipping Addresses
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [user1.user_id, '张三', '13800138001', '北京市朝阳区建国路88号', '北京', '北京市', '100022', '中国', 1]
        );
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [user1.user_id, '张三', '13800138001', '上海市浦东新区世纪大道100号', '上海', '上海市', '200120', '中国', 0]
        );
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [user2.user_id, '李四', '13800138002', '深圳市南山区科技园', '深圳', '广东省', '518057', '中国', 1]
        );
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [seller.user_id, '王老板', '13800138003', '香港中环皇后大道中99号', '香港', '香港', '999077', '中国', 1]
        );
        
        console.log('✅ Shipping addresses inserted');
        
        console.log('\n=====================================');
        console.log('✅✅✅ SEEDING COMPLETED SUCCESSFULLY ✅✅✅');
        console.log('=====================================');
        console.log('\n📋 TEST ACCOUNTS (password: 123456):');
        console.log('   • user1     - Regular customer');
        console.log('   • user2     - Regular customer');  
        console.log('   • seller    - Seller account');
        console.log('\n🎵 SAMPLE ALBUMS:');
        console.log('   • Abbey Road - The Beatles');
        console.log('   • Thriller - Michael Jackson');
        console.log('   • Kind of Blue - Miles Davis');
        console.log('\n⭐ SAMPLE REVIEWS:');
        console.log('   • user1 rated Abbey Road (Mint): 5 stars');
        console.log('   • user1 rated Thriller (Good): 4 stars');
        console.log('   • user2 rated Kind of Blue (Near Mint): 5 stars');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        db.close();
    }
}

seedDatabase();