// backend/database/seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'record_store.db'));

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
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
        await runQuery('DELETE FROM Review_Replies');
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
        
        // Create 10 copies of "AM" by Arctic Monkeys
        console.log('\n📀 Creating 10 copies of "AM" by Arctic Monkeys...');
        
        for (let i = 1; i <= 10; i++) {
            const albumTitle = i === 1 ? 'AM' : `AM (Copy ${i})`;
            
            const result = await runQuery(
                `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    albumTitle,
                    'Arctic Monkeys',
                    'https://upload.wikimedia.org/wikipedia/en/7/70/Arctic_Monkeys_-_AM.png',
                    'Rock',
                    '1. Do I Wanna Know?\n2. R U Mine?\n3. One for the Road\n4. Arabella\n5. I Want It All\n6. No. 1 Party Anthem\n7. Mad Sounds\n8. Fireside\n9. Why’d You Only Call Me When You’re High?\n10. Snap Out of It\n11. Knee Socks\n12. I Wanna Be Yours',
                    2013
                ]
            );
            
            const albumId = result.lastID;
            console.log(`   ✅ Created album ${i}/10: ${albumTitle} (ID: ${albumId})`);
            
            // Add 3 products for each album (Mint, Near Mint, Good)
            const conditions = ['Mint', 'Near Mint', 'Good'];
            const prices = [39.99, 29.99, 19.99];
            const descriptions = [
                'Perfect condition, never played, still in shrink wrap.',
                'Excellent condition, played only a few times, cover in great shape.',
                'Good condition, some minor surface marks, plays great, cover shows some wear.'
            ];
            
            // Sample images for products (3 different images)
            const productImages = [
                'https://upload.wikimedia.org/wikipedia/en/7/70/Arctic_Monkeys_-_AM.png',
                'https://i.scdn.co/image/ab67616d0000b273e1b7f6c8b4f9c8c4f0e1a2b3',
                'https://images.genius.com/5a5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c.1000x1000x1.jpg'
            ];
            
            for (let j = 0; j < conditions.length; j++) {
                const productResult = await runQuery(
                    `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
                     VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
                    [
                        albumId,
                        conditions[j],
                        prices[j],
                        descriptions[j],
                        JSON.stringify(productImages)
                    ]
                );
                console.log(`      ✅ Added ${conditions[j]} product (ID: ${productResult.lastID}) for ${albumTitle} (¥${prices[j]})`);
            }
        }
        
        // Create 10 copies of "Purple Rain" by Prince
        console.log('\n💜 Creating 10 copies of "Purple Rain" by Prince...');
        
        for (let i = 1; i <= 10; i++) {
            const albumTitle = i === 1 ? 'Purple Rain' : `Purple Rain (Copy ${i})`;
            
            const result = await runQuery(
                `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    albumTitle,
                    'Prince',
                    'https://upload.wikimedia.org/wikipedia/en/6/6b/Prince_-_Purple_Rain.png',
                    'Pop',
                    '1. Let\'s Go Crazy\n2. Take Me with U\n3. The Beautiful Ones\n4. Computer Blue\n5. Darling Nikki\n6. When Doves Cry\n7. I Would Die 4 U\n8. Baby I\'m a Star\n9. Purple Rain',
                    1984
                ]
            );
            
            const albumId = result.lastID;
            console.log(`   ✅ Created album ${i}/10: ${albumTitle} (ID: ${albumId})`);
            
            // Add 3 products for each album (Mint, Near Mint, Good)
            const conditions = ['Mint', 'Near Mint', 'Good'];
            const prices = [49.99, 34.99, 24.99];
            const descriptions = [
                'Perfect condition, original pressing, never played.',
                'Near mint, played a few times, cover in excellent condition.',
                'Good condition, some wear on cover, vinyl plays great.'
            ];
            
            // Sample images for Prince products
            const productImages = [
                'https://upload.wikimedia.org/wikipedia/en/6/6b/Prince_-_Purple_Rain.png',
                'https://upload.wikimedia.org/wikipedia/en/9/9b/Prince_1999_album.jpg',
                'https://i.scdn.co/image/ab67616d0000b273c8f0b9a3c4d5e6f7a8b9c0d1'
            ];
            
            for (let j = 0; j < conditions.length; j++) {
                const productResult = await runQuery(
                    `INSERT INTO Products (album_id, condition, price, description, image_urls, is_active, created_at)
                     VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
                    [
                        albumId,
                        conditions[j],
                        prices[j],
                        descriptions[j],
                        JSON.stringify(productImages)
                    ]
                );
                console.log(`      ✅ Added ${conditions[j]} product (ID: ${productResult.lastID}) for ${albumTitle} (¥${prices[j]})`);
            }
        }
        
        // Get count of all albums and products
        const albumCount = await getQuery('SELECT COUNT(*) as count FROM Albums');
        const productCount = await getQuery('SELECT COUNT(*) as count FROM Products');
        
        console.log('\n✅ Total albums created:', albumCount.count);
        console.log('✅ Total products created:', productCount.count);
        
        // Add some forum messages
        console.log('\n💬 Adding forum messages...');
        await runQuery(
            'INSERT INTO Discussion_Bubbles (user_id, content, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [user1.user_id, 'Just got the AM vinyl! Sounds amazing! 🎵']
        );
        await runQuery(
            'INSERT INTO Discussion_Bubbles (user_id, content, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [user2.user_id, 'Looking for recommendations: what\'s your favorite album?']
        );
        await runQuery(
            'INSERT INTO Discussion_Bubbles (user_id, content, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [seller.user_id, 'New arrivals coming next week! Stay tuned 🎸']
        );
        console.log('✅ Forum messages added');
        
        console.log('\n=====================================');
        console.log('✅✅✅ SEEDING COMPLETED SUCCESSFULLY ✅✅✅');
        console.log('=====================================');
        console.log('\n📋 TEST ACCOUNTS (password: 123456):');
        console.log('   • user1     - Regular customer');
        console.log('   • user2     - Regular customer');  
        console.log('   • seller    - Seller account');
        console.log('\n📀 ALBUMS CREATED:');
        console.log('   • AM by Arctic Monkeys - 10 copies (30 products)');
        console.log('   • Purple Rain by Prince - 10 copies (30 products)');
        console.log(`   • Total: ${albumCount.count} albums, ${productCount.count} products`);
        console.log('\n💰 PRICES:');
        console.log('   • AM: Mint ¥39.99 | Near Mint ¥29.99 | Good ¥19.99');
        console.log('   • Purple Rain: Mint ¥49.99 | Near Mint ¥34.99 | Good ¥24.99');
        console.log('=====================================');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        db.close();
    }
}

seedDatabase();