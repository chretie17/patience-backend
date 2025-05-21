const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/users', projectController.getUsersByRole);

router.post('/', projectController.addProject);

router.get('/:project_id/images', projectController.getProjectImages);  // New route for images

router.get('/public/:project_id', projectController.getPublicProjectStatus);
router.put('/:project_id', upload.array('images'), projectController.updateProjectDetails);


router.get('/', projectController.getProjects);

// Update project progress/status
router.put('/', projectController.updateProjectProgress);

// Delete a project
router.delete('/:project_id', projectController.deleteProject);

module.exports = router;
