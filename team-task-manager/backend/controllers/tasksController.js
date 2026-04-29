// ============================================================
// controllers/tasksController.js - CRUD for tasks
// ============================================================

const Task    = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task inside a project
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } = req.body;

    // Ensure the project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ success: false, message: 'Project not found.' });

    const task = await Task.create({
      title, description, project, assignedTo, priority, dueDate,
      createdBy: req.user._id
    });

    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get tasks
//          Admin: all or filter by project | Member: only assigned tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'admin') {
      // Admin can filter by project
      if (req.query.project) filter.project = req.query.project;
    } else {
      // Member sees only their assigned tasks
      filter.assignedTo = req.user._id;
      if (req.query.project) filter.project = req.query.project;
    }

    // Optional status filter
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort('dueDate');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Members can only view tasks assigned to them
    if (req.user.role !== 'admin' && !task.assignedTo._id.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update task
//          Admin: full update | Member: can only update status
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Members can only update their own task's status
    if (req.user.role !== 'admin') {
      if (!task.assignedTo.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      // Restrict which fields a member can update
      const { status } = req.body;
      if (status) task.status = status;
      await task.save();
    } else {
      // Admin can update everything
      Object.assign(task, req.body);
      await task.save();
    }

    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Dashboard stats
// @route   GET /api/tasks/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };
    const now    = new Date();

    const [total, completed, pending, inProgress, overdue] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: 'completed' }),
      Task.countDocuments({ ...filter, status: 'pending' }),
      Task.countDocuments({ ...filter, status: 'in-progress' }),
      Task.countDocuments({ ...filter, status: { $ne: 'completed' }, dueDate: { $lt: now } })
    ]);

    res.json({ success: true, stats: { total, completed, pending, inProgress, overdue } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
