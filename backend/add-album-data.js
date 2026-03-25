const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'record_store.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding album orders...');

// Helper function
function subtractDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Series of operations using promises
async function run() {
  try {
    // Get albums
    const albums = await new Promise((resolve, reject) => {
      db.all('SELECT album_id FROM Albums LIMIT 2', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('Albums:', albums);

    // Add orders for each album across different weeks
    const weeks = [70, 56, 42, 28];
    let count = 0;

    for (const album of albums) {
      for (const offset of weeks) {
        const date = subtractDays(offset);

        await new Promise((resolve) => {
          db.run(
            'INSERT INTO Orders (user_id, total_amount, status, shipping_address, payment_method, created_at) VALUES (1, ?, ?, ?, ?, ?)',
            [(Math.random() * 100 + 50).toFixed(2), 'completed', 'Test', 'card', date],
            () => resolve()
          );
        });

        const orderId = count * albums.length + 1;

        // Add 2-3 items per order
        await new Promise((resolve) => {
          db.all('SELECT product_id, price FROM Products WHERE album_id = ? LIMIT 3', [album.album_id], (err, prods) => {
            prods.forEach((p, i) => {
              const qty = Math.floor(Math.random() * 2) + 1;
              db.run(
                'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                [orderId, p.product_id, qty, p.price],
                () => {
                  count++;
                  console.log(`Added ${count}/${albums.length * weeks.length}`);
                }
              );
            });
            resolve();
          });
        });
      }
    }

    console.log('\nDone! Orders added:', count);
    db.close();
  } catch (err) {
    console.error('Error:', err);
    db.close();
  }
}

run();
