// userProjectController.js
const db = require('../db');  // Assuming you've set up MySQL connection

// Get users with role 'member'
exports.getUsers = (req, res) => {
    console.log("Fetching users with role 'member'...");

    const query = `
      SELECT id, username 
      FROM users 
      WHERE role = 'member'
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users' });
        }

        console.log('Users fetched successfully:', result);
        res.status(200).json(result); // Send users with role 'member'
    });
};

// Get projects with project ID and project name
exports.getProjects = (req, res) => {
    console.log("Fetching projects...");
  
    const query = `
      SELECT id, project_name
      FROM projects
    `;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ message: 'Error fetching projects' });
      }
  
      console.log('Projects fetched successfully:', result);
      res.status(200).json(result); // Send projects with id and project_name
    });
  };
  