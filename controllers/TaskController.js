const db = require('../db');  // Assuming you've set up MySQL connection
const { validationResult } = require('express-validator');
const { utcToZonedTime } = require('date-fns-tz');


// Create a new task
exports.createTask = (req, res) => {
  const { title, description, assigned_user, start_date, end_date, status, priority, project_id, created_by } = req.body;

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Insert task into the database
  const query = `
    INSERT INTO tasks (title, description, assigned_user, start_date, end_date, status, priority, project_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [title, description, assigned_user, start_date, end_date, status, priority, project_id, created_by];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creating task:', err);
      return res.status(500).json({ message: 'Error creating task' });
    }
    res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
  });
};

const { format } = require('date-fns');

exports.getTasks = (req, res) => {
  const query = `
    SELECT t.*, 
      u1.username AS created_by_username,
      u2.username AS assigned_user_username
    FROM tasks t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_user = u2.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ message: 'Error fetching tasks' });
    }

    // Format the start_date and end_date using date-fns without timezones
    const formattedResults = results.map((task) => {
      return {
        ...task,
        start_date: task.start_date ? format(new Date(task.start_date), 'yyyy-MM-dd HH:mm:ss') : '',
        end_date: task.end_date ? format(new Date(task.end_date), 'yyyy-MM-dd HH:mm:ss') : '',
      };
    });

    res.status(200).json(formattedResults);
  });
};
  
exports.getTaskById = (req, res) => {
  const { taskId } = req.params;
  const query = `
    SELECT t.*, 
      u1.username AS created_by_username,
      u2.username AS assigned_user_username
    FROM tasks t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_user = u2.id
    WHERE t.id = ?
  `;

  db.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error fetching task:', err);
      return res.status(500).json({ message: 'Error fetching task' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(result[0]);
  });
};

// Update a task by ID
exports.updateTask = (req, res) => {
  const { taskId } = req.params;
  const { title, description, assigned_user, start_date, end_date, status, priority, project_id } = req.body;

  const query = `
    UPDATE tasks
    SET title = ?, description = ?, assigned_user = ?, start_date = ?, end_date = ?, status = ?, priority = ?, project_id = ?
    WHERE id = ?
  `;
  const values = [title, description, assigned_user, start_date, end_date, status, priority, project_id, taskId];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ message: 'Error updating task' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task updated successfully' });
  });
};

// Delete a task by ID
exports.deleteTask = (req, res) => {
  const { taskId } = req.params;
  const query = 'DELETE FROM tasks WHERE id = ?';

  db.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ message: 'Error deleting task' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  });
};

  // Get tasks assigned to a specific user
  exports.getAssignedTasks = (req, res) => {
    const { userId } = req.params; // Get userId from the request parameters
  
    console.log(`Fetching tasks assigned to user ID: ${userId}...`);
  
    const query = `
      SELECT t.*, 
        u1.username AS created_by_username,
        u2.username AS assigned_user_username
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_user = u2.id
      WHERE t.assigned_user = ?
    `;
  
    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching assigned tasks:', err);
        return res.status(500).json({ message: 'Error fetching assigned tasks' });
      }
  
      if (result.length === 0) {
        console.log('No tasks found for the assigned user.');
        return res.status(404).json({ message: 'No tasks found for this user' });
      }
  
      // Format the start_date and end_date using date-fns before sending the response
      const formattedResults = result.map((task) => {
        return {
          ...task,
          start_date: task.start_date ? format(new Date(task.start_date), 'yyyy-MM-dd HH:mm:ss') : null,
          end_date: task.end_date ? format(new Date(task.end_date), 'yyyy-MM-dd HH:mm:ss') : null,
        };
      });
  
      console.log(`Assigned tasks fetched successfully for user ID ${userId}:`, formattedResults);
      res.status(200).json(formattedResults);
    });
  };
  // Update task status by assigned user
exports.updateTaskStatus = (req, res) => {
  const { taskId } = req.params; // Task ID from URL
  const { status } = req.body; // New status from request body

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  const query = `
    UPDATE tasks
    SET status = ?
    WHERE id = ?
  `;
  const values = [status, taskId];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating task status:', err);
      return res.status(500).json({ message: 'Error updating task status' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task status updated successfully' });
  });
};
