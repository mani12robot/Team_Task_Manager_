// ============================================================
// routes/projects.js
// ============================================================

const express = require('express');
const router  = express.Router();
const {
  createProject, getProjects, getProject, updateProject, deleteProject
} = require('../controllers/projectsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);  // All routes require login

router.route('/')
  .get(getProjects)
  .post(authorize('admin'), createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('admin'), updateProject)
  .delete(authorize('admin'), deleteProject);

module.exports = router;
