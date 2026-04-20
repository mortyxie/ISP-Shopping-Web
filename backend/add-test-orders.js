const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'record_store.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding test orders for 12 weeks with weekly data points...');

// Get users and products first
db.all('SELECT user_id FROM Users', [], (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }

  if (users.length === 0) {
    console.log('No users found, exiting.');
    db.close();
    return;
  }

  db.all('SELECT product_id, price FROM Products LIMIT 10', [], (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      return;
    }

    if (products.length === 0) {
      console.log('No products found, exiting.');
      db.close();
      return;
    }

    console.log(`Found ${users.length} users and ${products.length} products`);
    console.log('Generating sample data for 12 weeks...');

    // Clear existing test orders (including those we're about to add)
    db.run("DELETE FROM Order_Items WHERE order_id >= 1000", [], (err) => {
      if (err) console.error('Error deleting order items:', err);
      else console.log('Deleted test order items');
    });

    db.run("DELETE FROM Orders WHERE order_id >= 1000", [], (err) => {
      if (err) console.error('Error deleting orders:', err);
      else console.log('Deleted test orders');
    });

    // Get next available order_id and order_item_id
    db.get('SELECT MAX(order_id) as max_order_id FROM Orders', [], (err, row) => {
      let orderId = (row?.max_order_id || 0) + 1;

      db.get('SELECT MAX(order_item_id) as max_item_id FROM Order_Items', [], (err, row) => {
        let orderItemId = (row?.max_item_id || 0) + 1;
        let totalOrders = 0;

        // Generate 12 weeks of data with fluctuating pattern
        // Start from 11 weeks ago and go up to today
        const today = new Date();
        const weeks = [];

        // Create 12 weeks of data starting from 11 weeks ago to now
        for (let i = 11; i >= 0; i--) {
          const weekDate = new Date(today);
          weekDate.setDate(weekDate.getDate() - (i * 7));

          // Get Monday of that week
          const dayOfWeek = weekDate.getDay();
          const monday = new Date(weekDate);
          monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

          weeks.push({
            weekNum: 12 - i, // Week number (1-12)
            start: new Date(monday),
            orders: 0
          });
        }

        // Create fluctuating sales pattern for 12 weeks
        // Pattern: 8 -> 12 -> 10 -> 15 -> 12 -> 9 -> 13 -> 11 -> 14 -> 10 -> 12 -> 8
        const weeklyOrderCounts = [8, 12, 10, 15, 12, 9, 13, 11, 14, 10, 12, 8];

        weeks.forEach((week, index) => {
          const ordersThisWeek = weeklyOrderCounts[index];
          const weekStart = week.start;

          console.log(`Week ${week.weekNum}: ${ordersThisWeek} orders, ${weekStart.toISOString().substring(0, 10)}`);

          // Generate orders for this week
          for (let i = 0; i < ordersThisWeek; i++) {
            // Distribute orders throughout the week (Monday to Sunday)
            const dayOffset = Math.floor((i / ordersThisWeek) * 7);
            const orderDate = new Date(weekStart);
            orderDate.setDate(orderDate.getDate() + dayOffset);
            orderDate.setHours(
              9 + Math.floor(Math.random() * 10), // 9-18 hours
              Math.floor(Math.random() * 60),
              Math.floor(Math.random() * 60)
            );

            // Random user
            const user = users[Math.floor(Math.random() * users.length)];

            // Random number of products (1-2)
            const numProducts = 1 + Math.floor(Math.random() * 2);
            let totalAmount = 0;

            // Format date for SQLite
            const createdAt = orderDate.toISOString().replace('T', ' ').substring(0, 19);
            const status = ['completed', 'shipped', 'paid', 'paid', 'paid'][Math.floor(Math.random() * 5)];

            // Create order
            const currentOrderId = orderId;
            db.run(
              `INSERT INTO Orders (order_id, user_id, total_amount, status, shipping_address, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [currentOrderId, user.user_id, 0, status, 'Test Address', createdAt],
              function(err) {
                if (err) {
                  console.error('Error inserting order:', err);
                } else {
                  // Create order items
                  const productItems = [];
                  for (let p = 0; p < numProducts; p++) {
                    const product = products[Math.floor(Math.random() * products.length)];
                    const quantity = 1 + Math.floor(Math.random() * 2);
                    const itemPrice = parseFloat(product.price);
                    const itemTotal = itemPrice * quantity;
                    totalAmount += itemTotal;

                    productItems.push({
                      product_id: product.product_id,
                      quantity: quantity,
                      price_at_purchase: itemPrice
                    });
                  }

                  // Update order total amount
                  db.run(
                    `UPDATE Orders SET total_amount = ? WHERE order_id = ?`,
                    [totalAmount.toFixed(2), currentOrderId],
                    function(err) {
                      if (err) console.error('Error updating order total:', err);
                    }
                  );

                  // Insert order items
                  productItems.forEach(item => {
                    const currentItemItemId = orderItemId;
                    db.run(
                      `INSERT INTO Order_Items (order_item_id, order_id, product_id, quantity, price_at_purchase)
                       VALUES (?, ?, ?, ?, ?)`,
                      [currentItemItemId, currentOrderId, item.product_id, item.quantity, item.price_at_purchase.toFixed(2)],
                      function(err) {
                        if (err) console.error('Error inserting order item:', err);
                      }
                    );
                    orderItemId++;
                  });
                }
              }
            );

            orderId++;
            totalOrders++;
          }
        });

        // Wait for all operations to complete
        setTimeout(() => {
          console.log('\n✅ Test orders added successfully!');
          console.log(`Summary:`);
          console.log(`- ${totalOrders} orders added across 12 weeks`);
          console.log(`- Each week has data points: ${weeklyOrderCounts.join(', ')}`);
          console.log(`- X-axis will show 12 weekly date points`);
          console.log(`- Sales pattern: fluctuating trend`);
          console.log(`\nWeek order counts:`);
          weeklyOrderCounts.forEach((count, i) => {
            console.log(`  Week ${i + 1}: ${count} orders`);
          });
          console.log(`\nData coverage:`);
          console.log(`- Last 4 weeks: ${weeklyOrderCounts.slice(8, 12).join(', ')} orders`);
          console.log(`- Last 8 weeks: ${weeklyOrderCounts.slice(4, 12).join(', ')} orders`);
          console.log(`\nRestart backend server to see updated reports.`);
          db.close();
        }, 3000);
      });
    });
  });
});
