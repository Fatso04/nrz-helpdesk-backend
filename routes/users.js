// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// GET ALL USERS (for assignee dropdown)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('name email _id');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;