const db = require('../db');

// Get all inventory items
exports.getAllItems = (req, res) => {
  const query = 'SELECT * FROM inventory_items ORDER BY name';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching inventory items:', err);
      return res.status(500).json({ message: 'Error fetching inventory items' });
    }
    res.status(200).json(results);
  });
};

// Get items by category
exports.getItemsByCategory = (req, res) => {
  const { category } = req.params;
  const query = 'SELECT * FROM inventory_items WHERE category = ? ORDER BY name';
  
  db.query(query, [category], (err, results) => {
    if (err) {
      console.error('Error fetching items by category:', err);
      return res.status(500).json({ message: 'Error fetching items' });
    }
    res.status(200).json(results);
  });
};

// Add new inventory item
exports.addItem = (req, res) => {
  const { name, category, unit, current_stock } = req.body;
  
  const query = 'INSERT INTO inventory_items (name, category, unit, current_stock) VALUES (?, ?, ?, ?)';
  
  db.query(query, [name, category, unit, current_stock], (err, result) => {
    if (err) {
      console.error('Error adding inventory item:', err);
      return res.status(500).json({ message: 'Error adding inventory item' });
    }
    res.status(201).json({ message: 'Item added successfully', itemId: result.insertId });
  });
};

// Update inventory item
exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { name, category, unit, current_stock } = req.body;
  
  const query = 'UPDATE inventory_items SET name = ?, category = ?, unit = ?, current_stock = ? WHERE id = ?';
  
  db.query(query, [name, category, unit, current_stock, id], (err, result) => {
    if (err) {
      console.error('Error updating inventory item:', err);
      return res.status(500).json({ message: 'Error updating inventory item' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({ message: 'Item updated successfully' });
  });
};

// Delete inventory item
exports.deleteItem = (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM inventory_items WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting inventory item:', err);
      return res.status(500).json({ message: 'Error deleting inventory item' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({ message: 'Item deleted successfully' });
  });
};

// Record inventory usage
// Record inventory usage
exports.recordUsage = (req, res) => {
  const { task_id, items, used_by } = req.body; // items is array of {item_id, quantity_used}

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items provided' });
  }

  // grab a connection from the pool
  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error('Connection error:', connErr);
      return res.status(500).json({ message: 'Database connection error' });
    }

    connection.beginTransaction(beginErr => {
      if (beginErr) {
        console.error('Transaction begin error:', beginErr);
        connection.release();
        return res.status(500).json({ message: 'Transaction error' });
      }

      let completed = 0;
      let hasError = false;

      items.forEach(item => {
        const { item_id, quantity_used } = item;

        // 1) check stock
        connection.query(
          'SELECT current_stock FROM inventory_items WHERE id = ?',
          [item_id],
          (chkErr, chkRes) => {
            if (hasError) return;
            if (chkErr) {
              hasError = true;
              console.error('Error checking stock:', chkErr);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: 'Error checking stock' });
              });
            }
            if (chkRes.length === 0) {
              hasError = true;
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({ message: `Item with ID ${item_id} not found` });
              });
            }
            if (chkRes[0].current_stock < quantity_used) {
              hasError = true;
              return connection.rollback(() => {
                connection.release();
                res.status(400).json({ message: `Not enough stock for item ID ${item_id}` });
              });
            }

            // 2) record usage
            connection.query(
              'INSERT INTO inventory_usage (task_id, item_id, quantity_used, used_by) VALUES (?, ?, ?, ?)',
              [task_id, item_id, quantity_used, used_by],
              (useErr) => {
                if (hasError) return;
                if (useErr) {
                  hasError = true;
                  console.error('Error recording usage:', useErr);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ message: 'Error recording usage' });
                  });
                }

                // 3) update stock
                connection.query(
                  'UPDATE inventory_items SET current_stock = current_stock - ? WHERE id = ?',
                  [quantity_used, item_id],
                  (updErr) => {
                    if (hasError) return;
                    if (updErr) {
                      hasError = true;
                      console.error('Error updating stock:', updErr);
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ message: 'Error updating stock' });
                      });
                    }

                    // once all items done, commit
                    completed++;
                    if (completed === items.length) {
                      connection.commit(commitErr => {
                        if (commitErr) {
                          console.error('Error committing transaction:', commitErr);
                          return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ message: 'Error committing transaction' });
                          });
                        }
                        connection.release();
                        res.status(200).json({ message: 'Usage recorded successfully' });
                      });
                    }
                  }
                );
              }
            );
          }
        );
      });
    });
  });
};

// Get usage history for a task
// Get usage history for an item
exports.getUsageByItem = (req, res) => {
  const { item_id } = req.params;
  
  const query = `
    SELECT iu.*, ii.name as item_name, ii.unit, u.username as used_by_name
    FROM inventory_usage iu
    JOIN inventory_items ii ON iu.item_id = ii.id
    JOIN users u ON iu.used_by = u.id
    WHERE iu.item_id = ?
    ORDER BY iu.usage_date DESC
  `;
  
  db.query(query, [item_id], (err, results) => {
    if (err) {
      console.error('Error fetching usage history:', err);
      return res.status(500).json({ message: 'Error fetching usage history' });
    }
    res.status(200).json(results);
  });
};
exports.getUsageByTask = (req, res) => {
  const { task_id } = req.params;
  
  const query = `
    SELECT iu.*, ii.name as item_name, ii.unit, u.username as used_by_name
    FROM inventory_usage iu
    JOIN inventory_items ii ON iu.item_id = ii.id
    JOIN users u ON iu.used_by = u.id
    WHERE iu.task_id = ?
    ORDER BY iu.usage_date DESC
  `;
  
  db.query(query, [task_id], (err, results) => {
    if (err) {
      console.error('Error fetching usage history:', err);
      return res.status(500).json({ message: 'Error fetching usage history' });
    }
    res.status(200).json(results);
  });
};

// Get all categories
exports.getCategories = (req, res) => {
  const query = 'SELECT DISTINCT category FROM inventory_items ORDER BY category';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ message: 'Error fetching categories' });
    }
    res.status(200).json(results.map(row => row.category));
  });
};