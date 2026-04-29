// ============================================================
// controllers/projectsController.js - CRUD for projects
// ============================================================

const Project = require('../models/Project');
const Task    = require('../models/Task');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.create({
      name,
      description,
      members: members || [],
      createdBy: req.user._id
    });
    await project.populate('members', 'name email role');
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all projects
//          Admin: all projects | Member: only projects they belong to
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Project.find();
    } else {
      // Members only see projects they are part of
      query = Project.find({ members: req.user._id });
    }

    const projects = await query
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Members can only view their own projects
    if (req.user.role !== 'admin' && !project.members.some(m => m._id.equals(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update project (add/remove members, rename, etc.)
// @route   PUT /api/projects/:id
// @access  Private/Admin
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete project and its tasks
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Remove all tasks for this project
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and its tasks deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
