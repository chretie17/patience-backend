const express = require('express');
const router = express.Router();
const clientController = require('../controllers/ClientController');

// Client management routes (Admin only)

// GET all clients
router.get('/clients', clientController.getAllClients);

// GET single client with full details
router.get('/clients/:clientId', clientController.getClientById);

// POST create new client
router.post('/clients', clientController.createClient);

// PUT update client information
router.put('/clients/:clientId', clientController.updateClient);

// DELETE client (soft delete)
router.delete('/clients/:clientId', clientController.deleteClient);

// Service history routes
// POST add service history for a client
router.post('/clients/:clientId/service-history', clientController.addServiceHistory);

// Contract routes
// POST add contract for a client (with document upload)
router.post('/clients/:clientId/contracts', clientController.addContract);

// GET download contract document
router.get('/contracts/:contractId/download', clientController.downloadContract);

module.exports = router;