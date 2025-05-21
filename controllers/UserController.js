const db = require('../db');
const bcrypt = require('bcrypt');

// Register a new user
exports.registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        db.query(query, [username, email, hashedPassword, role || 'member'], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Login user
exports.loginUser = (req, res) => {
    const { identifier, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(query, [identifier, identifier], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        try {
            // Compare plaintext password with hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            res.status(200).json({
                message: 'Login successful',
                user: { id: user.id, username: user.username, role: user.role },
            });
        } catch (compareError) {
            return res.status(500).json({ error: compareError.message });
        }
    });
};

// Get all users
exports.getAllUsers = (req, res) => {
    db.query('SELECT id, username, email, role, created_at FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
};

// Get a user by ID
exports.getUserById = (req, res) => {
    const { id } = req.params;

    db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(results[0]);
    });
};

// Update a user
exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { username, email, role } = req.body;

    const query = 'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?';
    db.query(query, [username, email, role, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User updated successfully' });
    });
};

// Delete a user
exports.deleteUser = (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    });
};
