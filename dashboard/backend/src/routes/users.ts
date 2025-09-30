import express from 'express';
import { protect } from '../middleware/auth';
const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile endpoint - to be implemented'
  });
});

// @desc    Get user transactions
// @route   GET /api/users/transactions
// @access  Private
router.get('/transactions', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User transactions endpoint - to be implemented'
  });
});

// @desc    Get user rewards progress
// @route   GET /api/users/rewards/progress
// @access  Private
router.get('/rewards/progress', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User rewards progress endpoint - to be implemented'
  });
});

// @desc    Daily check-in
// @route   POST /api/users/daily-checkin
// @access  Private
router.post('/daily-checkin', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Daily check-in endpoint - to be implemented'
  });
});

export default router;