const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
router.get('/project/:project_id', projectController.getPublicProjectStatus); // ✅ Correct Path

module.exports = router;