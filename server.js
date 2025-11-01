const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Import http to create the server
const socketIo = require('socket.io'); // Import socket.io
const jwt = require('jsonwebtoken'); // Import jwt for token verification
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes); // ADD THIS LINE

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server);

// Middleware for socket authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'NRZ Helpdesk Backend is LIVE!',
    status: 'success',
    api: '/api/tickets',
    docs: 'https://github.com/Fatso04/nrz-helpdesk-backend',
    time: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Assign the io instance to global for access in controllers
global.io = io; // CRITICAL: Allows controllers to emit

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});





// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));