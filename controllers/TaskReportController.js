const db = require('../db');
const { format } = require('date-fns');

const formatDateForSQL = (date) => {
    return format(new Date(date), 'yyyy-MM-dd');
};

// Updated getTasks to match the actual database schema
exports.getTasks = (req, res) => {
    const { start_date, end_date, status, priority, assigned_user } = req.query;

    let query = `
        SELECT
            t.id,
            t.title AS task_name,
            p.project_name,
            u.username AS assigned_user,
            t.status,
            DATE_FORMAT(t.end_date, '%Y-%m-%d') AS due_date,
            t.priority,
            DATE_FORMAT(t.created_at, '%Y-%m-%d') AS created_at,
            DATE_FORMAT(t.updated_at, '%Y-%m-%d') AS updated_at,
            t.description
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_user
        WHERE 1=1
    `;

    // Add filters
    if (start_date && end_date) {
        query += ` AND t.end_date BETWEEN '${formatDateForSQL(start_date)}' AND '${formatDateForSQL(end_date)}'`;
    }

    if (status) {
        // Handle multiple statuses if provided as comma-separated string
        const statuses = status.split(',').map(s => `'${s.trim()}'`).join(',');
        query += ` AND t.status IN (${statuses})`;
    }

    if (priority) {
        // Handle multiple priorities if provided as comma-separated string
        const priorities = priority.split(',').map(p => `'${p.trim()}'`).join(',');
        query += ` AND t.priority IN (${priorities})`;
    }

    if (assigned_user) {
        query += ` AND u.username = '${assigned_user}'`;
    }

    // Order by due date and priority
    query += ` ORDER BY t.end_date ASC, 
              CASE 
                WHEN t.priority = 'High' THEN 1 
                WHEN t.priority = 'Medium' THEN 2 
                ELSE 3 
              END`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching tasks:", err);
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json(results);
    });
};

// Updated getTaskStatusSummary to match the actual database schema
exports.getTaskStatusSummary = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            t.status,
            COUNT(*) as count,
            ROUND((COUNT(*) / (SELECT COUNT(*) FROM tasks)) * 100, 2) as percentage
        FROM tasks t
        WHERE 1=1
    `;

    if (start_date && end_date) {
        query += ` AND t.end_date BETWEEN '${formatDateForSQL(start_date)}' AND '${formatDateForSQL(end_date)}'`;
    }

    query += ` GROUP BY t.status`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching task status summary:", err);
            return res.status(500).json({ message: "Error fetching task status summary" });
        }
        res.status(200).json(results);
    });
};

// Updated getTaskCompletionTrend to match the actual database schema
exports.getTaskCompletionTrend = (req, res) => {
    const { period = 'week', start_date, end_date } = req.query;
    
    let dateFormat;
    let groupBy;

    // Determine date format and grouping based on period
    switch(period.toLowerCase()) {
        case 'day':
            dateFormat = '%Y-%m-%d';
            groupBy = 'DATE(t.updated_at)';
            break;
        case 'week':
            dateFormat = '%x-W%v'; // Year-Week format (e.g., 2023-W01)
            groupBy = 'YEARWEEK(t.updated_at)';
            break;
        case 'month':
            dateFormat = '%Y-%m';
            groupBy = 'DATE_FORMAT(t.updated_at, "%Y-%m")';
            break;
        case 'quarter':
            dateFormat = '%Y-Q%Q'; // Custom format for quarter
            groupBy = 'CONCAT(YEAR(t.updated_at), "-Q", QUARTER(t.updated_at))';
            break;
        default:
            dateFormat = '%Y-%m';
            groupBy = 'DATE_FORMAT(t.updated_at, "%Y-%m")';
    }

    let query = `
        SELECT
            DATE_FORMAT(t.updated_at, '${dateFormat}') AS time_period,
            COUNT(*) AS completed_tasks
        FROM tasks t
        WHERE t.status = 'Completed'
    `;

    if (start_date && end_date) {
        query += ` AND t.updated_at BETWEEN '${formatDateForSQL(start_date)}' AND '${formatDateForSQL(end_date)}'`;
    }

    query += ` GROUP BY ${groupBy} ORDER BY MIN(t.updated_at)`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching task completion trend:", err);
            return res.status(500).json({ message: "Error fetching task completion trend" });
        }
        res.status(200).json(results);
    });
};

// Updated getTasksByPriority to match the actual database schema
exports.getTasksByPriority = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            t.priority,
            COUNT(*) as count,
            SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN t.status = 'Delayed' THEN 1 ELSE 0 END) as delayed,
            ROUND(
                (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100,
                2
            ) as completion_rate
        FROM tasks t
        WHERE 1=1
    `;

    if (start_date && end_date) {
        query += ` AND t.end_date BETWEEN '${formatDateForSQL(start_date)}' AND '${formatDateForSQL(end_date)}'`;
    }

    query += ` GROUP BY t.priority
              ORDER BY CASE 
                WHEN t.priority = 'High' THEN 1 
                WHEN t.priority = 'Medium' THEN 2 
                ELSE 3 
              END`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching tasks by priority:", err);
            return res.status(500).json({ message: "Error fetching tasks by priority" });
        }
        res.status(200).json(results);
    });
};

// Updated getOverdueTasks to match the actual database schema
exports.getOverdueTasks = (req, res) => {
    let query = `
        SELECT
            t.id,
            t.title AS task_name,
            p.project_name,
            u.username AS assigned_user,
            t.status,
            DATE_FORMAT(t.end_date, '%Y-%m-%d') AS due_date,
            t.priority,
            DATEDIFF(CURDATE(), t.end_date) AS days_overdue
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_user
        WHERE t.end_date < CURDATE()
        AND t.status != 'Completed'
        ORDER BY days_overdue DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching overdue tasks:", err);
            return res.status(500).json({ message: "Error fetching overdue tasks" });
        }
        res.status(200).json(results);
    });
};

// Get task count by status
exports.getTaskCountByStatus = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT 
            status,
            COUNT(*) as count
        FROM tasks
        WHERE 1=1
    `;

    if (start_date && end_date) {
        query += ` AND end_date BETWEEN '${formatDateForSQL(start_date)}' AND '${formatDateForSQL(end_date)}'`;
    }

    query += ` GROUP BY status`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching task counts:", err);
            return res.status(500).json({ message: "Error fetching task counts" });
        }
        res.status(200).json(results);
    });
};

// Get task distribution by user
exports.getTaskDistributionByUser = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT 
            u.username,
            COUNT(*) as total_tasks,
            SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
            SUM(CASE WHEN t.status = 'Delayed' THEN 1 ELSE 0 END) as delayed_tasks
        FROM tasks t
        LEFT JOIN users u ON t.assigned_user = u.id
        WHERE u.username IS NOT NULL
    `;

    if (start_date && end_date) {
        query += ` AND t.end_date BETWEEN '${formatDateForSQL(start_date)}' AND '${formatDateForSQL(end_date)}'`;
    }

    query += ` GROUP BY u.username
              ORDER BY total_tasks DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching task distribution:", err);
            return res.status(500).json({ message: "Error fetching task distribution" });
        }
        res.status(200).json(results);
    });
};