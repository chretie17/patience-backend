const db = require('../db');

// Helper function to execute queries
const executeQuery = (query, values = []) => {
    return new Promise((resolve, reject) => {
        db.query(query, values, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

// 📌 **1. Get Total Projects by Status**
exports.getTotalProjectsByStatus = async (req, res) => {
    try {
        const query = `
            SELECT status, COUNT(*) AS count
            FROM projects
            GROUP BY status;
        `;
        const result = await executeQuery(query);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching total projects by status:", error);
        res.status(500).json({ message: "Error fetching project data" });
    }
};

// 📌 **2. Get Recently Updated Projects**
exports.getRecentProjects = async (req, res) => {
    try {
        const query = `
            SELECT id, project_name, status, updated_at
            FROM projects
            ORDER BY updated_at DESC
            LIMIT 5;
        `;
        const result = await executeQuery(query);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching recent projects:", error);
        res.status(500).json({ message: "Error fetching recent projects" });
    }
};

// 📌 **3. Get Total Tasks by Status**
exports.getTotalTasksByStatus = async (req, res) => {
    try {
        const query = `
            SELECT status, COUNT(*) AS count
            FROM tasks
            GROUP BY status;
        `;
        const result = await executeQuery(query);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching tasks by status:", error);
        res.status(500).json({ message: "Error fetching task data" });
    }
};

// 📌 **4. Get Recently Assigned Tasks**
exports.getRecentTasks = async (req, res) => {
    try {
        const query = `
            SELECT id, title, status, assigned_user, updated_at
            FROM tasks
            ORDER BY updated_at DESC
            LIMIT 5;
        `;
        const result = await executeQuery(query);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching recent tasks:", error);
        res.status(500).json({ message: "Error fetching recent tasks" });
    }
};

// 📌 **5. Get Total Number of Users**
exports.getTotalUsers = async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) AS total_users FROM users;
        `;
        const result = await executeQuery(query);
        res.status(200).json(result[0]); // Send as object, not array
    } catch (error) {
        console.error("Error fetching total users:", error);
        res.status(500).json({ message: "Error fetching user data" });
    }
};

// 📌 **6. Get Total Budget Across All Projects**
exports.getTotalBudget = async (req, res) => {
    try {
        const query = `
            SELECT SUM(budget) AS total_budget FROM projects;
        `;
        const result = await executeQuery(query);
        res.status(200).json(result[0]); // Send as object, not array
    } catch (error) {
        console.error("Error fetching total budget:", error);
        res.status(500).json({ message: "Error fetching budget data" });
    }
};
