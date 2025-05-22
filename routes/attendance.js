// attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/AttendanceController');

// Routes
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/all', attendanceController.getAllAttendance);
router.get('/user/:user_id', attendanceController.getUserAttendance);

module.exports = router;
