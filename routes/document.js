const express = require('express');
const { getDocumentsByProject, createDocument, getDocumentContent } = require('../controllers/documentController');

const router = express.Router();

router.get('/:projectId', getDocumentsByProject);
router.post('/', createDocument);
router.get('/content/:id', getDocumentContent);

module.exports = router;
