const express = require('express');
const router = express.Router();
const projectController = require('../controllers/TechnicianProjectController'); 


router.get('/assigned/:userId', projectController.getAssignedProject);
router.put('/assigned/:userId', projectController.updateAssignedProject);

module.exports = router;
