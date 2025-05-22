// userProjectController.js
const db = require('../db');  // Assuming you've set up MySQL connection

// Get users with role 'technician'
exports.getUsers = (req, res) => {
    console.log("Fetching users with role 'technician'...");

    const query = `
      SELECT id, username 
      FROM users 
      WHERE role = 'technician'
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users' });
        }

        console.log('Users fetched successfully:', result);
        res.status(200).json(result); // Send users with role 'technician'
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
  