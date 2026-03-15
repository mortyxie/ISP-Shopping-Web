// backend/database/seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'record_store.db'));

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    console.log('=====================================');
    
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('123456', 10);
        console.log('✅ Password hashed successfully');
        
        // Use serialize for sequential execution
        db.serialize(() => {
            // Disable foreign keys temporarily
            db.run('PRAGMA foreign_keys = OFF');
            
            // Clear existing data
            console.log('\n📝 Clearing existing data...');
            db.run('DELETE FROM Cart_Items');
            db.run('DELETE FROM Order_Items');
            db.run('DELETE FROM Orders');
            db.run('DELETE FROM Reviews');
            db.run('DELETE FROM Discussion_Bubbles');
            db.run('DELETE FROM Products');
            db.run('DELETE FROM Albums');
            db.run('DELETE FROM Shipping_Address');
            db.run('DELETE FROM Users');
            console.log('✅ All tables cleared');
            
            db.run('PRAGMA foreign_keys = ON');
            
            // ==================== INSERT USERS ====================
            console.log('\n👤 Inserting test users...');
            
            const users = [
                ['user1', 'user1@example.com', hashedPassword, null, 'customer'],
                ['user2', 'user2@example.com', hashedPassword, null, 'customer'],
                ['seller', 'seller@example.com', hashedPassword, null, 'admin']
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
            
            // ==================== INSERT SHIPPING ADDRESSES ====================
            console.log('\n📍 Inserting shipping addresses...');
            
            // Get user IDs
            db.all('SELECT user_id, username FROM Users', [], (err, userRows) => {
                if (err) {
                    console.error('Error getting users:', err);
                    return;
                }
                
                // Create address data
                const addressData = [];
                
                userRows.forEach(user => {
                    if (user.username === 'user1') {
                        addressData.push({
                            user_id: user.user_id,
                            recipient_name: '张三',
                            phone: '13800138001',
                            address_line1: '北京市朝阳区建国路88号',
                            address_line2: 'SOHO现代城A座1203室',
                            city: '北京',
                            state: '北京市',
                            postal_code: '100022',
                            country: '中国',
                            is_default: 1
                        });
                        addressData.push({
                            user_id: user.user_id,
                            recipient_name: '张三',
                            phone: '13800138001',
                            address_line1: '上海市浦东新区世纪大道100号',
                            address_line2: '上海环球金融中心45层',
                            city: '上海',
                            state: '上海市',
                            postal_code: '200120',
                            country: '中国',
                            is_default: 0
                        });
                    } else if (user.username === 'user2') {
                        addressData.push({
                            user_id: user.user_id,
                            recipient_name: '李四',
                            phone: '13800138002',
                            address_line1: '广东省深圳市南山区科技园',
                            address_line2: '腾讯大厦B座',
                            city: '深圳',
                            state: '广东省',
                            postal_code: '518057',
                            country: '中国',
                            is_default: 1
                        });
                        addressData.push({
                            user_id: user.user_id,
                            recipient_name: '李四',
                            phone: '13800138002',
                            address_line1: '广州市天河区珠江新城',
                            address_line2: '广州国际金融中心',
                            city: '广州',
                            state: '广东省',
                            postal_code: '510620',
                            country: '中国',
                            is_default: 0
                        });
                    } else if (user.username === 'seller') {
                        addressData.push({
                            user_id: user.user_id,
                            recipient_name: '王老板',
                            phone: '13800138003',
                            address_line1: '香港中环皇后大道中99号',
                            address_line2: '中环中心',
                            city: '香港',
                            state: '香港特别行政区',
                            postal_code: '999077',
                            country: '中国',
                            is_default: 1
                        });
                    }
                });
                
                let addressCount = 0;
                addressData.forEach(addr => {
                    db.run(
                        `INSERT INTO Shipping_Address (
                            user_id, recipient_name, phone, address_line1, address_line2,
                            city, state, postal_code, country, is_default, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                        [
                            addr.user_id, addr.recipient_name, addr.phone, 
                            addr.address_line1, addr.address_line2,
                            addr.city, addr.state, addr.postal_code, 
                            addr.country, addr.is_default
                        ],
                        function(err) {
                            if (err) {
                                console.error('Error inserting address:', err.message);
                            } else {
                                addressCount++;
                            }
                        }
                    );
                });
                
                setTimeout(() => {
                    console.log(`✅ Inserted ${addressCount} shipping addresses`);
                    
                    console.log('\n=====================================');
                    console.log('✅✅✅ SEEDING COMPLETED SUCCESSFULLY ✅✅✅');
                    console.log('=====================================');
                    console.log('\n📊 DATABASE SUMMARY:');
                    console.log(`   👤 Users: ${users.length}`);
                    console.log(`   📍 Addresses: ${addressCount}`);
                    console.log(`   💿 Albums: 0 (to be added by seller)`);
                    console.log(`   📦 Products: 0 (to be added by seller)`);
                    
                    console.log('\n📋 TEST ACCOUNTS (password: 123456):');
                    console.log('   • user1     - Regular customer with 2 addresses');
                    console.log('   • user2     - Regular customer with 2 addresses');
                    console.log('   • seller    - Seller account with 1 address');
                    
                    console.log('\n📍 DEFAULT ADDRESSES:');
                    console.log('   • user1     - Beijing (default), Shanghai');
                    console.log('   • user2     - Shenzhen (default), Guangzhou');
                    console.log('   • seller    - Hong Kong');
                    
                    console.log('\n🚀 Next steps:');
                    console.log('   1. Login with any test account');
                    console.log('   2. Test address management');
                    console.log('   3. Seller can add albums/products');
                    console.log('=====================================');
                    
                    db.close();
                }, 1000);
            });
        });
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        db.close();
    }
}

// Run the seed
seedDatabase();