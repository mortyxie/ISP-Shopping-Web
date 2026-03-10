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
            db.run('DELETE FROM Users');
            console.log('✅ All tables cleared');
            
            db.run('PRAGMA foreign_keys = ON');
            
            // ==================== INSERT USERS ====================
            console.log('\n👤 Inserting users...');
            
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
            
            // ==================== FINAL SUMMARY ====================
            setTimeout(() => {
                console.log('\n=====================================');
                console.log(' SEEDING COMPLETED SUCCESSFULLY ');
                console.log('=====================================');
                console.log('\n📊 DATABASE SUMMARY:');
                console.log(`    Users: ${users.length}`);
                console.log(`    Albums: 0 (to be added by seller)`);
                console.log(`    Products: 0 (to be added by seller)`);
                console.log(`    Forum Messages: 0`);
                
                console.log('\n TEST ACCOUNTS (password: 123456):');
                console.log('   • user1     - Regular customer');
                console.log('   • user2     - Regular customer');
                console.log('   • seller    - Seller account');
                console.log('   • john_doe  - Regular customer');
                console.log('   • jane_smith - Regular customer');
                
                console.log('\n Next steps:');
                console.log('   1. Login as seller (seller/123456)');
                console.log('   2. Add albums and products through Seller Dashboard');
                console.log('   3. Test the store with buyer accounts');
                console.log('=====================================');
                
                db.close();
            }, 1000);
        });
        
    } catch (error) {
        console.error('Seeding error:', error);
        db.close();
    }
}

// Run the seed
seedDatabase();