// attendanceController.js
const db = require('../db');

// Technician checks in
exports.checkIn = (req, res) => {
  const { user_id, check_in_location } = req.body;

  if (!check_in_location || check_in_location.trim() === '') {
    return res.status(400).json({ message: 'Location is required for check-in' });
  }

  const today = new Date().toISOString().split('T')[0];

  const checkQuery = `
    SELECT id FROM attendance
    WHERE user_id = ? AND date = ?
  `;

  db.query(checkQuery, [user_id, today], (checkErr, results) => {
    if (checkErr) {
      return res.status(500).json({ message: 'Error checking attendance record', error: checkErr });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'You have already checked in today' });
    }

    const insertQuery = `
      INSERT INTO attendance (user_id, date, check_in, check_in_location)
      VALUES (?, ?, NOW(), ?)
    `;

    db.query(insertQuery, [user_id, today, check_in_location], (err) => {
      if (err) return res.status(500).json({ message: 'Check-in failed', error: err });
      res.status(200).json({ message: 'Check-in recorded successfully' });
    });
  });
};


// Technician checks out
exports.checkOut = (req, res) => {
  const { user_id, check_out_location } = req.body;

  if (!check_out_location || check_out_location.trim() === '') {
    return res.status(400).json({ message: 'Location is required for check-out' });
  }

  const today = new Date().toISOString().split('T')[0];

  const checkQuery = `
    SELECT check_out FROM attendance
    WHERE user_id = ? AND date = ?
  `;

  db.query(checkQuery, [user_id, today], (checkErr, results) => {
    if (checkErr) {
      return res.status(500).json({ message: 'Error checking attendance', error: checkErr });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    if (results[0].check_out) {
      return res.status(400).json({ message: 'You have already checked out today' });
    }

    const updateQuery = `
      UPDATE attendance
      SET check_out = NOW(), check_out_location = ?
      WHERE user_id = ? AND date = ?
    `;

    db.query(updateQuery, [check_out_location, user_id, today], (err) => {
      if (err) return res.status(500).json({ message: 'Check-out failed', error: err });
      res.status(200).json({ message: 'Check-out recorded successfully' });
    });
  });
};

// Admin fetches all attendance
exports.getAllAttendance = (req, res) => {
  const query = `
    SELECT a.*, u.username
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.date DESC, u.username
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve attendance', error: err });
    res.status(200).json(results);
  });
};

// Get attendance of a single user
exports.getUserAttendance = (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT * FROM attendance
    WHERE user_id = ?
    ORDER BY date DESC
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve attendance', error: err });
    res.status(200).json(results);
  });
};