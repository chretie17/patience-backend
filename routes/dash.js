const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');

// 📌 **Dashboard Routes**
router.get('/projects/status', dashboardController.getTotalProjectsByStatus);
router.get('/projects/recent', dashboardController.getRecentProjects);
router.get('/tasks/status', dashboardController.getTotalTasksByStatus);
router.get('/tasks/recent', dashboardController.getRecentTasks);
router.get('/users/count', dashboardController.getTotalUsers);
router.get('/projects/budget', dashboardController.getTotalBudget);

module.exports = router;
