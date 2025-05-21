const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const tascontroller = require('../controllers/tascontroller');

// Create a new task
router.post('/', taskController.createTask);

// Get all tasks
router.get('/', taskController.getTasks);

// Get a specific task by ID
router.get('/:taskId', taskController.getTaskById);

// Update a task by ID
router.put('/:taskId', taskController.updateTask);

// Delete a task by ID
router.delete('/:taskId', taskController.deleteTask);


router.get('/assigned/:userId', taskController.getAssignedTasks);

router.put('/:taskId/status', taskController.updateTaskStatus);


module.exports = router;
