const db = require('../db');
const { format } = require('date-fns');

const formatDateForSQL = (date) => {
    return format(new Date(date), 'yyyy-MM-dd');
};

exports.getProjectOverview = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            p.id AS project_id,
            p.project_name,
            p.status,
            DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
            p.budget,
            u.username AS assigned_user,
            COUNT(DISTINCT t.id) AS total_tasks,
            SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
            ROUND(
                COALESCE(
                    (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(DISTINCT t.id), 0),
                    0
                ),
                2
            ) AS task_completion_rate
        FROM projects p
        LEFT JOIN users u ON u.id = p.assigned_user
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE 1=1
    `;

    if (start_date && end_date) {
        query += ` AND p.start_date <= '${formatDateForSQL(end_date)}' AND p.end_date >= '${formatDateForSQL(start_date)}'`;
    }

    query += ` GROUP BY p.id, p.project_name, p.status, p.start_date, p.end_date, p.budget, u.username`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching project overview:', err);
            return res.status(500).json({ message: 'Error fetching project overview' });
        }
        res.status(200).json(results);
    });
};

exports.getUserPerformance = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            u.username,
            COUNT(DISTINCT t.id) AS total_tasks,
            SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
            SUM(CASE WHEN t.status = 'Delayed' THEN 1 ELSE 0 END) AS delayed_tasks,
            ROUND(
                COALESCE(
                    (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(DISTINCT t.id), 0),
                    0
                ),
                2
            ) AS completion_rate
        FROM users u
        LEFT JOIN tasks t ON t.assigned_user = u.id
        WHERE u.role NOT IN ('Engineer', 'Admin')
    `;

    if (start_date && end_date) {
        query += ` AND t.start_date <= '${formatDateForSQL(end_date)}' 
                  AND t.end_date >= '${formatDateForSQL(start_date)}'`;
    }

    query += ` GROUP BY u.username`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching user performance:", err);
            return res.status(500).json({ message: "Error fetching user performance" });
        }
        res.status(200).json(results);
    });
};
exports.getProjectStatus = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            p.project_name,
            DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
            ROUND(
                COALESCE(
                    (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(DISTINCT t.id), 0),
                    0
                ),
                2
            ) AS completion_percentage,
            DATEDIFF(p.end_date, CURDATE()) AS days_remaining,
            CASE
                WHEN DATEDIFF(p.end_date, CURDATE()) < 0 THEN 'Overdue'
                WHEN ROUND(
                    COALESCE(
                        (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0) / 
                        NULLIF(COUNT(DISTINCT t.id), 0),
                        0
                    ),
                    2
                ) >= 80 THEN 'On Track'
                WHEN ROUND(
                    COALESCE(
                        (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0) / 
                        NULLIF(COUNT(DISTINCT t.id), 0),
                        0
                    ),
                    2
                ) >= 50 THEN 'At Risk'
                ELSE 'Delayed'
            END AS project_status,
            COUNT(DISTINCT t.id) AS total_tasks,
            SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE 1=1
    `;

    if (start_date && end_date) {
        query += ` AND p.start_date <= '${formatDateForSQL(end_date)}' AND p.end_date >= '${formatDateForSQL(start_date)}'`;
    }

    query += ` GROUP BY p.project_name, p.start_date, p.end_date`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching project status:", err);
            return res.status(500).json({ message: "Error fetching project status" });
        }
        res.status(200).json(results);
    });
};

exports.getRecentProjectUpdates = (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            DATE_FORMAT(updated_at, '%Y-%m') AS month,
            COUNT(*) AS projects_updated
        FROM projects
        WHERE updated_at IS NOT NULL
    `;

    if (start_date && end_date) {
        query += ` AND updated_at >= '${formatDateForSQL(start_date)}' AND updated_at <= '${formatDateForSQL(end_date)}'`;
    }

    query += ` GROUP BY DATE_FORMAT(updated_at, '%Y-%m') ORDER BY month DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching project updates:', err);
            return res.status(500).json({ message: 'Error fetching project updates' });
        }
        res.status(200).json(results);
    });
};