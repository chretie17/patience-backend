const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const taskReportController = require('../controllers/taskReportController'); // Import the new controller

// Existing report routes
router.get('/project-overview', reportController.getProjectOverview);
router.get('/user-performance', reportController.getUserPerformance);
router.get('/project-status', reportController.getProjectStatus);
router.get('/recent-updates', reportController.getRecentProjectUpdates);

// New task report routes
router.get('/tasks', taskReportController.getTasks);
router.get('/task-status-summary', taskReportController.getTaskStatusSummary);
router.get('/task-completion-trend', taskReportController.getTaskCompletionTrend);
router.get('/tasks-by-priority', taskReportController.getTasksByPriority);
router.get('/overdue-tasks', taskReportController.getOverdueTasks);

module.exports = router;