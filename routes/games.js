const express = require('express');
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { gameActions, checkGameEnd, generateCommentary } = require('../utils/gameLogic');
const dbConnect = require('../utils/dbConnect');

const router = express.Router();

// @desc    Create new game
// @route   POST /api/games
// @access  Private
router.post('/', [
  body('gameTime')
    .optional()
    .isInt({ min: 30, max: 300 })
    .withMessage('Game time must be between 30 and 300 seconds')
], protect, async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { gameTime = 60 } = req.body;

    // Create new game
    const game = await Game.create({
      player: req.user.id,
      playerName: req.user.fullName,
      gameTime,
      timeRemaining: gameTime
    });

    // Add game start log
    const startLog = {
      action: 'game_start',
      playerDamage: 0,
      monsterDamage: 0,
      playerHealthAfter: 100,
      monsterHealthAfter: 100,
      description: `Game started! ${req.user.fullName} vs Covid Monster (${gameTime}s timer)`
    };

    game.gameLogs.push(startLog);
    await game.save();

    res.status(201).json({
      success: true,
      game: {
        id: game._id,
        playerName: game.playerName,
        playerHealth: game.playerHealth,
        monsterHealth: game.monsterHealth,
        gameTime: game.gameTime,
        timeRemaining: game.timeRemaining,
        status: game.status,
        gameLogs: game.gameLogs.slice(-10), // Last 10 logs
        createdAt: game.createdAt
      }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating game'
    });
  }
});

// @desc    Get user's games
// @route   GET /api/games
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({ player: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-gameLogs'); // Exclude logs for list view

    const total = await Game.countDocuments({ player: req.user.id });

    res.status(200).json({
      success: true,
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching games'
    });
  }
});

// @desc    Get specific game
// @route   GET /api/games/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const game = await Game.findOne({
      _id: req.params.id,
      player: req.user.id
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.status(200).json({
      success: true,
      game: {
        id: game._id,
        playerName: game.playerName,
        playerHealth: game.playerHealth,
        monsterHealth: game.monsterHealth,
        gameTime: game.gameTime,
        timeRemaining: game.timeRemaining,
        status: game.status,
        winner: game.winner,
        gameLogs: game.gameLogs,
        totalDamageDealt: game.totalDamageDealt,
        totalDamageTaken: game.totalDamageTaken,
        createdAt: game.createdAt,
        completedAt: game.completedAt,
        duration: game.duration
      }
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game'
    });
  }
});

// @desc    Perform game action
// @route   POST /api/games/:id/action
// @access  Private
router.post('/:id/action', [
  body('action')
    .isIn(['attack', 'Blast', 'heal', 'Giveup'])
    .withMessage('Invalid action'),
  body('timeRemaining')
    .isInt({ min: 0 })
    .withMessage('Invalid time remaining')
], protect, async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { action, timeRemaining } = req.body;

    const game = await Game.findOne({
      _id: req.params.id,
      player: req.user.id,
      status: 'active'
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Active game not found'
      });
    }

    // Update time remaining
    game.timeRemaining = timeRemaining;

    let result;
    let logEntry;

    if (action === 'Giveup') {
      result = gameActions.Giveup(game.playerHealth, game.monsterHealth);
      game.status = 'surrendered';
      game.winner = 'monster';
      game.completedAt = new Date();
    } else {
      result = gameActions[action](game.playerHealth, game.monsterHealth);
      
      // Update health
      game.playerHealth = result.playerHealthAfter;
      game.monsterHealth = result.monsterHealthAfter;
      
      // Update damage stats
      game.totalDamageDealt += result.monsterDamage;
      game.totalDamageTaken += result.playerDamage;

      // Check if game is over
      const gameEnd = checkGameEnd(game.playerHealth, game.monsterHealth, game.timeRemaining);
      if (gameEnd.isOver) {
        game.status = 'completed';
        game.winner = gameEnd.winner;
        game.completedAt = new Date();
      }
    }

    // Create log entry
    logEntry = {
      action,
      playerDamage: result.playerDamage,
      monsterDamage: result.monsterDamage,
      playerHealthAfter: result.playerHealthAfter,
      monsterHealthAfter: result.monsterHealthAfter,
      description: result.description
    };

    game.gameLogs.push(logEntry);

    // If game ended, add end log
    if (game.status === 'completed' || game.status === 'surrendered') {
      const endLog = {
        action: 'game_end',
        playerDamage: 0,
        monsterDamage: 0,
        playerHealthAfter: game.playerHealth,
        monsterHealthAfter: game.monsterHealth,
        description: `Game ended! ${game.winner === 'player' ? game.playerName + ' wins!' : game.winner === 'monster' ? 'Covid Monster wins!' : 'Draw!'}`
      };
      game.gameLogs.push(endLog);

      // Update user stats
      const user = await User.findById(req.user.id);
      user.gamesPlayed += 1;
      if (game.winner === 'player') {
        user.gamesWon += 1;
      }
      user.totalDamageDealt += game.totalDamageDealt;
      user.totalDamageTaken += game.totalDamageTaken;
      await user.save();
    }

    await game.save();

    res.status(200).json({
      success: true,
      game: {
        id: game._id,
        playerName: game.playerName,
        playerHealth: game.playerHealth,
        monsterHealth: game.monsterHealth,
        timeRemaining: game.timeRemaining,
        status: game.status,
        winner: game.winner,
        gameLogs: game.gameLogs.slice(-10), // Last 10 logs
        actionResult: {
          action,
          playerDamage: result.playerDamage,
          monsterDamage: result.monsterDamage,
          healingAmount: result.healingAmount || 0,
          description: result.description
        }
      }
    });
  } catch (error) {
    console.error('Game action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error performing action'
    });
  }
});

// @desc    Get game statistics
// @route   GET /api/games/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const stats = await Game.aggregate([
      { $match: { player: req.user._id } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          gamesWon: { $sum: { $cond: [{ $eq: ['$winner', 'player'] }, 1, 0] } },
          gamesLost: { $sum: { $cond: [{ $eq: ['$winner', 'monster'] }, 1, 0] } },
          gamesDraw: { $sum: { $cond: [{ $eq: ['$winner', 'timeout'] }, 1, 0] } },
          totalDamageDealt: { $sum: '$totalDamageDealt' },
          totalDamageTaken: { $sum: '$totalDamageTaken' },
          avgGameDuration: { $avg: { $subtract: ['$completedAt', '$createdAt'] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalGames: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDraw: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      avgGameDuration: 0
    };

    result.winRate = result.totalGames > 0 ? Math.round((result.gamesWon / result.totalGames) * 100) : 0;
    result.avgGameDuration = result.avgGameDuration ? Math.round(result.avgGameDuration / 1000) : 0;

    res.status(200).json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = router;
