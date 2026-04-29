// ============================================================
// routes/tasks.js
// ============================================================

const express = require('express');
const router  = express.Router();
const {
  createTask, getTasks, getTask, updateTask, deleteTask, getStats
} = require('../controllers/tasksController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Dashboard stats - must be before /:id to avoid conflict
router.get('/stats', getStats);

router.route('/')
  .get(getTasks)
  .post(authorize('admin'), createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)                     // Members can update status of own tasks
  .delete(authorize('admin'), deleteTask);

module.exports = router;
