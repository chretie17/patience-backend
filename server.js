const express = require('express');
const cors = require('cors'); // Import cors middleware
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/task');
const documentRoutes = require('./routes/document');
const tasRoutes = require('./routes/tas');
const assignedRoutes = require('./routes/assignedproject');
const publicRoutes = require('./routes/public');
const dashboardRoutes = require('./routes/dash');
const reportsRoutes = require('./routes/report');
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project', assignedRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/tas', tasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
