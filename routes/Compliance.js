const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/complianceController');

// ============= TECHNICIAN ROUTES =============

// Record a safety check
router.post('/checks', safetyController.recordSafetyCheck);

// Report a safety incident
router.post('/incidents', safetyController.reportIncident);

// Get safety status for a specific task
router.get('/tasks/:taskId/status', safetyController.getTaskSafetyStatus);

// Get technician's own safety checks
router.get('/technician/:technicianId/checks', safetyController.getTechnicianChecks);

// Get technician's own reported incidents
router.get('/technician/:technicianId/incidents', safetyController.getTechnicianIncidents);

// ============= ADMIN ROUTES =============

// Get all safety checks
router.get('/checks', safetyController.getAllSafetyChecks);

// Get all safety incidents
router.get('/incidents', safetyController.getAllIncidents);

// Resolve a safety incident
router.patch('/incidents/:incidentId/resolve', safetyController.resolveIncident);

// Get safety dashboard overview
router.get('/dashboard', safetyController.getSafetyDashboard);

// Create safety audit
router.post('/audits', safetyController.createSafetyAudit);

// Get all safety audits
router.get('/audits', safetyController.getAllAudits);

// Get safety audits for a specific task
router.get('/tasks/:taskId/audits', safetyController.getTaskAudits);

module.exports = router;