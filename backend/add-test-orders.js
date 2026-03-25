const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'record_store.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding test orders for different weeks...');

// Helper to get a random price
const getRandomPrice = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

// Add orders for different weeks
const testOrders = [
  {
    user_id: 1,
    total_amount: 99.99,
    status: 'completed',
    shipping_address: 'Test Address',
    payment_method: 'credit_card'
  },
  {
    user_id: 1,
    total_amount: 79.99,
    status: 'completed',
    shipping_address: 'Test Address',
    payment_method: 'credit_card'
  },
  {
    user_id: 1,
    total_amount: 149.99,
    status: 'completed',
    shipping_address: 'Test Address',
    payment_method: 'credit_card'
  },
  {
    user_id: 1,
    total_amount: 129.99,
    status: 'completed',
    shipping_address: 'Test Address',
    payment_method: 'credit_card'
  }
];

// Helper to subtract days from a date and return ISO string
const subtractDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const orderDates = [
  subtractDays(70),   // ~10 weeks ago
  subtractDays(56),   // ~8 weeks ago
  subtractDays(42),   // ~6 weeks ago
  subtractDays(28)    // ~4 weeks ago
];

console.log('Order dates:', orderDates);

// Insert orders
testOrders.forEach((order, index) => {
  const orderDate = orderDates[index];
  console.log(`Creating order ${index + 1} at ${orderDate}`);

  db.run(
    `INSERT INTO Orders (user_id, total_amount, status, shipping_address, payment_method, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [order.user_id, order.total_amount, order.status, order.shipping_address, order.payment_method, orderDate],
    function(err) {
      if (err) {
        console.error('Error inserting order:', err);
      } else {
        console.log(`Order created successfully, ID: ${this.lastID}`);

        // Get the order ID and create order items
        const orderId = this.lastID;

        // Get some existing products to create order items
        db.all('SELECT product_id, price FROM Products LIMIT 3', [], (err2, products) => {
          if (err2) {
            console.error('Error fetching products:', err2);
            return;
          }

          products.forEach((product) => {
            const quantity = Math.floor(Math.random() * 2) + 1; // 1-3 items
            const itemPrice = product.price;

            db.run(
              `INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase)
               VALUES (?, ?, ?, ?)`,
              [orderId, product.product_id, quantity, itemPrice],
              function(err3) {
                if (err3) {
                  console.error('Error inserting order item:', err3);
                } else {
                  console.log(`Order item created: order=${orderId}, product=${product.product_id}, qty=${quantity}`);
                }
              }
            );
          });
        });
      }
    }
  );
});

// Close database after all operations
setTimeout(() => {
  console.log('\n✅ Test orders added successfully!');
  console.log('Summary:');
  console.log('- 5 orders added with different dates');
  console.log('- Dates spanning ~10 weeks');
  console.log('- Each order has 1-3 items');
  console.log('\nRestart backend server to see updated reports.');
  db.close();
}, 1000);
