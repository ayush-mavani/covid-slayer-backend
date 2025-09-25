const mongoose = require('mongoose');

const gameLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['attack', 'Blast', 'heal', 'Giveup', 'game_start', 'game_end']
  },
  playerDamage: {
    type: Number,
    default: 0
  },
  monsterDamage: {
    type: Number,
    default: 0
  },
  playerHealthAfter: {
    type: Number,
    required: true
  },
  monsterHealthAfter: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  }
});

const gameSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  playerHealth: {
    type: Number,
    default: 100
  },
  monsterHealth: {
    type: Number,
    default: 100
  },
  gameTime: {
    type: Number,
    default: 60 // seconds
  },
  timeRemaining: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'surrendered'],
    default: 'active'
  },
  winner: {
    type: String,
    enum: ['player', 'monster', 'timeout'],
    default: null
  },
  gameLogs: [gameLogSchema],
  totalDamageDealt: {
    type: Number,
    default: 0
  },
  totalDamageTaken: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Add index for better query performance
gameSchema.index({ player: 1, createdAt: -1 });
gameSchema.index({ status: 1 });

// Virtual for game duration
gameSchema.virtual('duration').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / 1000);
  }
  return null;
});

// Ensure virtual fields are serialized
gameSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);
