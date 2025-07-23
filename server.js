// Updated server.js with Socket.io
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/task');
const documentRoutes = require('./routes/document');
const tasRoutes = require('./routes/tas');
const assignedRoutes = require('./routes/assignedproject');
const publicRoutes = require('./routes/public');
const dashboardRoutes = require('./routes/dash');
const reportsRoutes = require('./routes/report');
const attendanceRoutes = require('./routes/attendance');
const communicationRoutes = require('./routes/communication');
const inventoryRoutes = require('./routes/inventory');
const clientRoutes = require('./routes/client');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = 3000;

// Enable CORS
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling with better logging and error handling
io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    // User joins with their ID
    socket.on('join', (userId) => {
        if (!userId) {
            console.error('Invalid user ID provided:', userId);
            return;
        }

        // Remove user from any existing socket connections
        for (let [existingUserId, existingSocketId] of connectedUsers.entries()) {
            if (existingUserId === userId.toString()) {
                connectedUsers.delete(existingUserId);
                console.log(`Removed existing connection for user ${userId}`);
            }
        }

        // Add new connection
        connectedUsers.set(userId.toString(), socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);
        console.log('Currently connected users:', Array.from(connectedUsers.keys()));

        // Send confirmation to user
        socket.emit('joined', { userId, socketId: socket.id });
    });

    // Handle user status/heartbeat
    socket.on('ping', () => {
        socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`Socket ${socket.id} disconnected:`, reason);
        
        // Remove user from connected users
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`Removed user ${userId} from connected users`);
                break;
            }
        }
        
        console.log('Remaining connected users:', Array.from(connectedUsers.keys()));
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Add debugging middleware for socket connections
app.use((req, res, next) => {
    req.io = io;
    req.connectedUsers = connectedUsers;
    
    // Add debugging endpoint
    if (req.path === '/api/debug/connected-users') {
        return res.json({
            connectedUsers: Array.from(connectedUsers.entries()),
            totalConnections: connectedUsers.size
        });
    }
    
    next();
});

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
app.use('/api/attendance', attendanceRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/', clientRoutes);
app.use('/api/safety', require('./routes/Compliance'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        connectedUsers: connectedUsers.size,
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start Server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Socket.io server is ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

// Export io for use in other files
module.exports = { io, connectedUsers };