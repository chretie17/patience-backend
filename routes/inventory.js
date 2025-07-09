const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/InventoryController');

// Get all inventory items
router.get('/items', inventoryController.getAllItems);

// Get items by category
router.get('/items/category/:category', inventoryController.getItemsByCategory);

// Get all categories
router.get('/categories', inventoryController.getCategories);

// Add new inventory item
router.post('/items', inventoryController.addItem);

// Update inventory item
router.put('/items/:id', inventoryController.updateItem);
// Get usage history for an item
router.get('/usage/item/:item_id', inventoryController.getUsageByItem);
// Delete inventory item
router.delete('/items/:id', inventoryController.deleteItem);

// Record inventory usage
router.post('/usage', inventoryController.recordUsage);

// Get usage history for a task
router.get('/usage/task/:task_id', inventoryController.getUsageByTask);

module.exports = router;