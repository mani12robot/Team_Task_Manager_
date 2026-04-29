// ============================================================
// routes/users.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getAllUsers, getUser } = require('../controllers/usersController');
const { protect, authorize }  = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

router.get('/',    authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUser);

module.exports = router;
