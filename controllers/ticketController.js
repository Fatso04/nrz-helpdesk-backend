const Ticket = require('../models/Ticket');


const createTicket = async (req, res) => {
  const { title, description, priority, assignedTo } = req.body;
  try {
    const ticket = new Ticket({
      title,
      description,
      priority: priority || 'medium',
      createdBy: req.user.id,
      assignedTo: assignedTo || null, // Allow assignment
    });
    await ticket.save();
    const populated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    global.io.emit('new-ticket', populated);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE
/*exports.createTicket = async (req, res) => {
  try {
    const ticket = new Ticket({
      ...req.body,
      createdBy: req.user.id,
      assignedTo: req.body.assignedTo || null, // Allow assignment
    });
    const saved = await ticket.save();
    await saved.populate('createdBy', 'name email');
    await saved.populate('assignedTo', 'name email');

    // Emit the new ticket event
    global.io.emit('new-ticket', saved);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};*/

// GET ALL
exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET USER'S
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.id })
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.deleteTicket = async (req, res) => {
  try {
    const deleted = await Ticket.deleteOne({ _id: req.params.id });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    // Emit the ticket deletion event
    global.io.emit('ticket-deleted', { id: req.params.id });
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateTicket = async (req, res) => {
  const { title, description, status, priority, assignedTo } = req.body;
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Allow all fields to be updated
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority; // Priority editable
    if (assignedTo) ticket.assignedTo = assignedTo;

    await ticket.save();
    const populated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');

    // Emit the ticket updated event
    global.io.emit('ticket-updated', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};