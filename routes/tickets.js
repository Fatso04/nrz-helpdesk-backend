// backend/routes/tickets.js
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect, admin } = require('../middleware/authMiddleware');

// CREATE TICKET
router.post('/', protect, async (req, res) => {
  const { title, description, priority, assignedTo } = req.body;

  try {
    // Check for duplicate ticket
    const existingTicket = await Ticket.findOne({ title, user: req.user._id });
    if (existingTicket) {
      return res.status(400).json({ message: 'Ticket with this title already exists' });
    }

    const ticket = await Ticket.create({
      user: req.user._id,
      title,
      description,
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
    });

    // POPULATE BEFORE EMITTING
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    // EMIT POPULATED TICKET TO ALL
    global.io.emit('new-ticket', populatedTicket);

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE TICKET
router.put('/:id', protect, async (req, res) => {
  const { status, assignedTo, priority } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (req.user.role !== 'admin' && (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    ticket.status = status || ticket.status;
    ticket.assignedTo = assignedTo || ticket.assignedTo;
    ticket.priority = priority || ticket.priority;
    ticket.updatedAt = Date.now();

    const updatedTicket = await ticket.save();

    // POPULATE BEFORE EMITTING
    const populated = await Ticket.findById(updatedTicket._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    global.io.emit('ticket-updated', populated);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL TICKETS (ADMIN)
router.get('/', protect, admin, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET MY TICKETS
router.get('/my-tickets', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE TICKET
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE TICKET (ADMIN)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    await Ticket.deleteOne({ _id: ticket._id });

    global.io.emit('ticket-deleted', { id: req.params.id });

    res.json({ message: 'Ticket removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;