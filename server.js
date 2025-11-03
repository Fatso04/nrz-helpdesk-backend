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
const mongoose = require('mongoose');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes); // ADD THIS LINE

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://nrz-helpdesk-frontend.vercel.app'
  ],
  credentials: true
}));

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

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // These are now in the URI — no need to repeat
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

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

app.get('/', (req, res) => {
    res.send('Welcome to the NRZ Helpdesk API!');
});

app.use(cors({
  origin: ['http://localhost:3000', 'https://nrz-helpdesk-frontend-*.vercel.app', 'https://nrz-helpdesk-frontend.vercel.app'],
  credentials: true,
}));

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));