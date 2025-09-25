const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        winRate: user.winRate,
        totalDamageDealt: user.totalDamageDealt,
        totalDamageTaken: user.totalDamageTaken,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, avatar } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        winRate: user.winRate,
        totalDamageDealt: user.totalDamageDealt,
        totalDamageTaken: user.totalDamageTaken,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const leaderboard = await User.find({ gamesPlayed: { $gt: 0 } })
      .sort({ winRate: -1, gamesWon: -1 })
      .skip(skip)
      .limit(limit)
      .select('fullName avatar gamesPlayed gamesWon winRate totalDamageDealt totalDamageTaken');

    const total = await User.countDocuments({ gamesPlayed: { $gt: 0 } });

    res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard'
    });
  }
});

// @desc    Get user's recent games
// @route   GET /api/users/recent-games
// @access  Private
router.get('/recent-games', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const recentGames = await Game.find({ player: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('playerName playerHealth monsterHealth status winner createdAt completedAt duration');

    res.status(200).json({
      success: true,
      games: recentGames
    });
  } catch (error) {
    console.error('Get recent games error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent games'
    });
  }
});

module.exports = router;
