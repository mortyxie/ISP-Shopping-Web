// backend/database/seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'record_store.db'));

async function seedDatabase() {
    console.log(' Starting database seeding...');
    console.log('=====================================');
    
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('123456', 10);
        console.log('✅ Password hashed successfully');
        
        // Use serialize for sequential execution
        db.serialize(() => {
            // Disable foreign keys temporarily
            db.run('PRAGMA foreign_keys = OFF');
            
            // Clear existing data - matching your exact table names
            console.log('\n Clearing existing data...');
            db.run('DELETE FROM Cart_Items');
            db.run('DELETE FROM Order_Items');
            db.run('DELETE FROM Orders');
            db.run('DELETE FROM Reviews');
            db.run('DELETE FROM Discussion_Bubbles');
            db.run('DELETE FROM Products');
            db.run('DELETE FROM Albums');
            db.run('DELETE FROM Users');
            console.log(' All tables cleared');
            
            db.run('PRAGMA foreign_keys = ON');
            
            // ==================== 1. INSERT USERS ====================
            console.log('\n👤 Inserting users...');
            
            const users = [
                ['user1', 'user1@example.com', hashedPassword, null, 'customer'],
                ['user2', 'user2@example.com', hashedPassword, null, 'customer'],
                ['seller', 'seller@example.com', hashedPassword, null, 'admin'],
                ['john_doe', 'john@example.com', hashedPassword, null, 'customer'],
                ['jane_smith', 'jane@example.com', hashedPassword, null, 'customer']
            ];
            
            users.forEach(user => {
                db.run(
                    `INSERT INTO Users (username, email, password_hash, avatar_url, role, created_at) 
                     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    user,
                    function(err) {
                        if (err) {
                            console.error('Error inserting user:', err.message);
                        }
                    }
                );
            });
            console.log(`✅ Inserted ${users.length} users`);
            
            // ==================== 2. INSERT ALBUMS ====================
            console.log('\n💿 Inserting albums...');
            
            const albums = [
                [
                    'AM', 
                    'Arctic Monkeys', 
                    'https://upload.wikimedia.org/wikipedia/en/0/04/Arctic_Monkeys_-_AM.png',
                    'Rock',
                    '1. Do I Wanna Know?, 2. R U Mine?, 3. One For The Road, 4. Arabella, 5. I Want It All, 6. No.1 Party Anthem, 7. Mad Sounds, 8. Fireside, 9. Whyd You Only Call Me When Youre High?, 10. Snap Out Of It, 11. Knee Socks, 12. I Wanna Be Yours',
                    1969
                ],
                [
                    'The Dark Side of the Moon', 
                    'Pink Floyd',
                    'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
                    'Rock',
                    '1. Speak to Me, 2. Breathe, 3. On the Run, 4. Time, 5. The Great Gig in the Sky, 6. Money, 7. Us and Them, 8. Any Colour You Like, 9. Brain Damage, 10. Eclipse',
                    1973
                ],
                [
                    'Led Zeppelin IV', 
                    'Led Zeppelin',
                    'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg',
                    'Rock',
                    '1. Black Dog, 2. Rock and Roll, 3. The Battle of Evermore, 4. Stairway to Heaven, 5. Misty Mountain Hop, 6. Four Sticks, 7. Going to California, 8. When the Levee Breaks',
                    1971
                ],
                [
                    'Thriller', 
                    'Michael Jackson',
                    'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
                    'Pop',
                    '1. Wanna Be Startin\' Somethin\', 2. Baby Be Mine, 3. The Girl Is Mine, 4. Thriller, 5. Beat It, 6. Billie Jean, 7. Human Nature, 8. P.Y.T., 9. The Lady in My Life',
                    1982
                ]
            ];
            
            albums.forEach(album => {
                db.run(
                    `INSERT INTO Albums (title, artist, cover_image_url, genre, tracklist, release_year, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    album,
                    function(err) {
                        if (err) {
                            console.error('Error inserting album:', err.message);
                        }
                    }
                );
            });
            console.log(`✅ Inserted ${albums.length} albums`);
            
            // ==================== 3. INSERT PRODUCTS ====================
            console.log('\n📦 Inserting products...');
            
            // Get album IDs after albums are inserted
            setTimeout(() => {
                db.all('SELECT album_id FROM Albums', [], (err, albumRows) => {
                    if (err) {
                        console.error('Error getting albums:', err);
                        return;
                    }
                    
                    if (albumRows.length === 0) {
                        console.error('❌ No albums found! Cannot insert products.');
                        return;
                    }
                    
                    console.log(`Found ${albumRows.length} albums, creating products...`);
                    
                    const conditions = ['Mint', 'Near Mint', 'Good'];
                    const basePrices = [299.99, 229.99, 159.99];
                    
                    const descriptions = {
                        'Mint': 'Perfect condition, original pressing. No scratches, plays flawlessly.',
                        'Near Mint': 'Almost perfect condition. Very minor wear, sounds great.',
                        'Good': 'Good condition. Some surface marks but plays well.'
                    };
                    
                    let productCount = 0;
                    
                    albumRows.forEach((album) => {
                        conditions.forEach((condition, conditionIndex) => {
                            // Create 2 products per condition
                            for (let copy = 1; copy <= 2; copy++) {
                                const price = basePrices[conditionIndex] * (0.95 + (Math.random() * 0.1));
                                
                                const description = `${condition} condition: ${descriptions[condition]}`;
                                
                                db.run(
                                    `INSERT INTO Products (
                                        album_id, condition, price, description, 
                                        image_urls, is_active, created_at
                                    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                                    [
                                        album.album_id,
                                        condition,
                                        Math.round(price * 100) / 100,
                                        description,
                                        JSON.stringify([`album_${album.album_id}_${condition}_${copy}.jpg`]),
                                        1
                                    ],
                                    function(err) {
                                        if (err) {
                                            console.error('Error inserting product:', err.message);
                                        } else {
                                            productCount++;
                                        }
                                    }
                                );
                            }
                        });
                    });
                    
                    // Wait for products to be inserted
                    setTimeout(() => {
                        console.log(`✅ Inserted ${productCount} products`);
                        
                        // ==================== 4. INSERT FORUM MESSAGES ====================
                        console.log('\n💬 Inserting forum messages...');
                        
                        const messages = [
                            ['user1', 'Just got Abbey Road on vinyl! Sounds incredible.'],
                            ['user2', 'Looking for Dark Side of the Moon in mint condition.'],
                            ['seller', 'New arrivals this weekend! 20% off all classic rock.'],
                            ['user1', 'My collection just hit 50 albums!'],
                            ['user2', 'The sound quality on vinyl is amazing.']
                        ];
                        
                        let messageCount = 0;
                        
                        messages.forEach((msg, index) => {
                            db.get('SELECT user_id FROM Users WHERE username = ?', [msg[0]], (err, user) => {
                                if (err || !user) {
                                    // Use user1 as fallback
                                    db.get('SELECT user_id FROM Users WHERE username = "user1"', [], (err, defaultUser) => {
                                        if (defaultUser) {
                                            db.run(
                                                `INSERT INTO Discussion_Bubbles (user_id, content, created_at) 
                                                 VALUES (?, ?, datetime("now", "-" || ? || " hours"))`,
                                                [defaultUser.user_id, msg[1], index * 5],
                                                function(err) {
                                                    if (!err) messageCount++;
                                                }
                                            );
                                        }
                                    });
                                } else {
                                    db.run(
                                        `INSERT INTO Discussion_Bubbles (user_id, content, created_at) 
                                         VALUES (?, ?, datetime("now", "-" || ? || " hours"))`,
                                        [user.user_id, msg[1], index * 5],
                                        function(err) {
                                            if (!err) messageCount++;
                                        }
                                    );
                                }
                            });
                        });
                        
                        setTimeout(() => {
                            console.log(`✅ Inserted ${messages.length} forum messages`);
                            
                            // ==================== 5. INSERT CART ITEMS ====================
                            console.log('\n🛒 Adding test cart items...');
                            
                            db.get('SELECT user_id FROM Users WHERE username = "user1"', [], (err, user) => {
                                if (err || !user) return;
                                
                                db.all('SELECT product_id FROM Products LIMIT 3', [], (err, products) => {
                                    if (err || !products || products.length === 0) return;
                                    
                                    products.forEach((product, idx) => {
                                        db.run(
                                            'INSERT INTO Cart_Items (user_id, product_id, quantity, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                                            [user.user_id, product.product_id, idx + 1]
                                        );
                                    });
                                    console.log('✅ Added test items to user1\'s cart');
                                });
                            });
                            
                            // ==================== FINAL SUMMARY ====================
                            setTimeout(() => {
                                console.log('\n=====================================');
                                console.log('✅✅✅ SEEDING COMPLETED SUCCESSFULLY ✅✅✅');
                                console.log('=====================================');
                                console.log('\n📊 DATABASE SUMMARY:');
                                console.log(`   👤 Users: ${users.length}`);
                                console.log(`   💿 Albums: ${albums.length}`);
                                console.log(`   📦 Products: ${productCount}`);
                                console.log(`   💬 Forum Messages: ${messages.length}`);
                                
                                console.log('\n📋 TEST ACCOUNTS (password: 123456):');
                                console.log('   • user1     - Regular customer');
                                console.log('   • user2     - Regular customer');
                                console.log('   • seller    - Admin/Seller account');
                                
                                console.log('\n🚀 Restart your backend: npm run dev');
                                console.log('=====================================');
                                
                                db.close();
                            }, 2000);
                            
                        }, 2000);
                        
                    }, 3000);
                });
            }, 1000);
        });
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        db.close();
    }
}

// Run the seed
seedDatabase();