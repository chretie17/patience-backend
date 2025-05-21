const multer = require('multer');
const { format } = require('date-fns');
const db = require('../db');

// Multer setup to handle file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage }); // Initialize multer with memory storage

// Helper function to execute queries
const executeQuery = (query, values) => {
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

// Get the project assigned to a member, including images
// Get the project assigned to a member, including images
exports.getAssignedProject = async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Query to get project data and associated images
      const query = `
        SELECT p.*, u.username AS assigned_user, pi.image
        FROM projects p
        LEFT JOIN users u ON u.id = p.assigned_user
        LEFT JOIN project_images pi ON pi.project_id = p.id
        WHERE p.assigned_user = ?
      `;
  
      const projects = await executeQuery(query, [userId]);
  
      if (projects.length === 0) {
        return res.status(404).json({ message: 'No assigned project found for this user' });
      }
  
      // Grouping projects with their associated images
      const projectMap = {};
  
      projects.forEach((project) => {
        const {
          id, image, assigned_user, project_name, description, status, start_date,
          end_date, budget, location
        } = project;
  
        // Initialize project entry if not already created
        if (!projectMap[id]) {
          projectMap[id] = {
            id,
            project_name,
            description,
            status,
            start_date: format(new Date(start_date), 'MM/dd/yyyy'),
            end_date: format(new Date(end_date), 'MM/dd/yyyy'),
            budget,
            location,
            assigned_user,
            images: [] // Initialize empty images array
          };
        }
  
        // Append images if available
        if (image) {
          projectMap[id].images.push(`data:image/jpeg;base64,${image.toString('base64')}`);
        }
      });
  
      // Convert projectMap into an array to return all projects
      const resultProjects = Object.values(projectMap);
  
      res.status(200).json(resultProjects);
  
    } catch (error) {
      console.error('Error fetching assigned project:', error);
      res.status(500).json({ message: 'Error fetching project' });
    }
  };
  

// Update project progress and add construction images
exports.updateAssignedProject = [upload.array('images', 10), async (req, res) => { // Ensure 'images' matches the frontend field name
    console.log('Request Body:', req.body); // Log the request body
    console.log('Uploaded Files:', req.files); // Log uploaded files
  
    const { userId } = req.params; // Get the userId from the URL
    const { project_id, status } = req.body; // Extract project_id and status
    const imageBlobs = req.files ? req.files.map(file => file.buffer) : []; // Process uploaded files
  
    if (!status || !project_id) {
      console.error('Missing required fields:', { status, project_id });
      return res.status(400).json({ message: 'Project ID and status are required' });
    }
  
    try {
      // Update the project status
      const updateQuery = 'UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND assigned_user = ?';
      const updateValues = [status, project_id, userId];
  
      await executeQuery(updateQuery, updateValues);
      console.log('Project status updated successfully.');
  
      // Insert new images into the project_images table
      if (imageBlobs.length > 0) {
        const imageQueries = imageBlobs.map(imageBlob => {
          const imageQuery = `
            INSERT INTO project_images (project_id, image)
            VALUES (?, ?)
          `;
          return executeQuery(imageQuery, [project_id, imageBlob]);
        });
  
        await Promise.all(imageQueries); // Wait for all image insertions
        console.log('Images added successfully.');
      }
  
      res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Error updating project' });
    }
  }];
  