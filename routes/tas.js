const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const tascontroller = require('../controllers/tascontroller');

router.get('/users', tascontroller.getUsers); 

router.get('/projects', tascontroller.getProjects); 

module.exports = router;
