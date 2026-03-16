import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

// Verify critical environment variables are loaded
console.log('\n🔧 Environment Variables Status:');
console.log('   JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('   JWT_EXPIRE:', process.env.JWT_EXPIRE);
console.log('   MONGODB_URI loaded:', !!process.env.MONGODB_URI);
console.log('   PORT:', process.env.PORT);
console.log('');

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import jobRoutes from './routes/job.routes.js';
import categoryRoutes from './routes/category.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from './routes/chat.routes.js';
import userJobRoutes from './modules/user/routes/user.routes.js';
import labourRoutes from './modules/labour/routes/labour.routes.js';
import contractorRoutes from './modules/contractor/routes/contractor.routes.js';
import adminRoutes from './modules/admin/routes/admin.routes.js';
import bannerRoutes from './modules/admin/routes/banner.admin.routes.js';

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io with CORS
const allowedSocketOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://contractor-eta.vercel.app',
    'https://www.majdoorsathi.com' // Add your production URL here
];

const io = new Server(server, {
    cors: {
        origin: allowedSocketOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userType = decoded.userType;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('✅ Socket connected:', socket.id, 'User:', socket.userId);
    }

    // Join user to their personal room
    socket.join(socket.userId.toString());

    // Join chat room
    socket.on('join-chat', (chatId) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('📥 User', socket.userId, 'joined chat:', chatId);
        }
        socket.join(chatId);
    });

    // Leave chat room
    socket.on('leave-chat', (chatId) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('📤 User', socket.userId, 'left chat:', chatId);
        }
        socket.leave(chatId);
    });

    // Send message
    socket.on('send-message', (data) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('💬 Message from', socket.userId, 'to chat:', data.chatId);
        }
        // Emit to all users in the chat room
        io.to(data.chatId).emit('receive-message', data);
    });

    // Mark messages as read
    socket.on('mark-read', (data) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('✓✓ Messages marked as read in chat:', data.chatId);
        }
        io.to(data.chatId).emit('messages-read', data);
    });

    // Typing indicator
    socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user-typing', {
            chatId: data.chatId,
            userId: socket.userId,
            isTyping: data.isTyping
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('❌ Socket disconnected:', socket.id);
        }
    });
});

// Make io accessible to routes
app.set('io', io);

// Middleware
// Enable gzip compression for all responses
app.use(compression({
    level: 6, // Compression level (0-9, 6 is default and balanced)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Use compression for all responses
        return compression.filter(req, res);
    }
}));

// CORS Configuration - Supports both development and production
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://contractor-eta.vercel.app',
    'https://www.majdoorsathi.com'
];

app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Increase body size limit for image uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`\n📨 ${req.method} ${req.path}`);
        if (Object.keys(req.body).length > 0) {
            console.log('Body keys:', Object.keys(req.body));
        }
        next();
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', userJobRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/categories', categoryRoutes); // Public categories route
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/contractor', contractorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes); // Public banners route

// Health check & VPS test route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        server: 'Express',
        vps_status: 'operational',
        pm2_monitored: !!process.env.PM2_HOME || !!process.env.npm_lifecycle_script?.includes('pm2'),
        database: connectDB.name === 'connectDB' ? 'initialized' : 'unknown',
        timestamp: new Date().toISOString(),
        uptime: process.uptime().toFixed(2) + ' seconds',
        message: 'VPS and Backend are working correctly! 🚀'
    });
});

app.get('/api/test-api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is reachable from VPS',
        headers: req.headers,
        ip: req.ip || req.headers['x-forwarded-for']
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error(`👉 FIX: Run this command to free the port:`);
        console.error(`   npx kill-port ${PORT}\n`);
        process.exit(1); // Clean exit so nodemon doesn't keep retrying
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`🔌 Socket.io server ready`);
});
