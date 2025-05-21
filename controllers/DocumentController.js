const db = require('../db');

// Get all documents for a project
exports.getDocumentsByProject = (req, res) => {
    const projectId = req.params.projectId;
    db.query('SELECT id, title, created_by, created_at FROM documents WHERE project_id = ?', [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
};

// Create a new document
exports.createDocument = (req, res) => {
    const { project_id, title, content, created_by } = req.body;
    const query = 'INSERT INTO documents (project_id, title, content, created_by) VALUES (?, ?, ?, ?)';
    db.query(query, [project_id, title, content, created_by], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Document created successfully', id: results.insertId });
    });
};

// Get document content by ID
exports.getDocumentContent = (req, res) => {
    const documentId = req.params.id;
    db.query('SELECT content FROM documents WHERE id = ?', [documentId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Document not found' });

        res.send(results[0].content);
    });
};
