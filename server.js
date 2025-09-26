const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Store connected users (max 2)
const connectedUsers = new Map();
const MAX_USERS = 2;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining
    socket.on('join', (username) => {
        // Check if room is full
        if (connectedUsers.size >= MAX_USERS) {
            socket.emit('error', { message: 'Chat room is full. Only 2 people can chat at a time.' });
            return;
        }

        // Check if username is already taken
        const existingUsers = Array.from(connectedUsers.values());
        if (existingUsers.includes(username)) {
            socket.emit('error', { message: 'Username is already taken. Please choose a different name.' });
            return;
        }

        // Add user to connected users
        connectedUsers.set(socket.id, username);
        socket.username = username;

        console.log(`${username} joined the chat`);

        // Notify all users about the new user
        socket.broadcast.emit('userJoined', { username });

        // Send current user list to all users
        const userList = Array.from(connectedUsers.values());
        io.emit('userList', userList);

        // Send welcome message
        socket.emit('message', {
            username: 'System',
            message: `Welcome to the chat, ${username}!`,
            timestamp: new Date().toISOString(),
            isSystem: true
        });
    });

    // Handle message sending
    socket.on('message', (data) => {
        if (!socket.username) {
            socket.emit('error', { message: 'You must join the chat first.' });
            return;
        }

        // Validate message
        if (!data.message || data.message.trim().length === 0) {
            return;
        }

        // Limit message length
        if (data.message.length > 1000) {
            socket.emit('error', { message: 'Message is too long. Maximum 1000 characters allowed.' });
            return;
        }

        const messageData = {
            username: socket.username,
            message: data.message.trim(),
            timestamp: new Date().toISOString()
        };

        console.log(`Message from ${socket.username}: ${data.message}`);

        // Broadcast message to all users
        io.emit('message', messageData);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        if (!socket.username) return;

        socket.broadcast.emit('typing', { username: socket.username });
    });

    socket.on('stopTyping', (data) => {
        if (!socket.username) return;

        socket.broadcast.emit('stopTyping', { username: socket.username });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`${socket.username} disconnected`);

            // Remove user from connected users
            connectedUsers.delete(socket.id);

            // Notify other users
            socket.broadcast.emit('userLeft', { username: socket.username });

            // Update user list for remaining users
            const userList = Array.from(connectedUsers.values());
            socket.broadcast.emit('userList', userList);
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
server.listen(PORT, () => {
    console.log(`Instagram Chat Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to start chatting!`);
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