// Game logic utilities for Covid Slayer

// Generate random damage between min and max
const generateRandomDamage = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random healing amount
const generateRandomHealing = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Game action handlers
const gameActions = {
  // Regular attack
  attack: (playerHealth, monsterHealth) => {
    const playerDamage = generateRandomDamage(1, 10);
    const monsterDamage = generateRandomDamage(1, 10);
    
    const newPlayerHealth = Math.max(0, playerHealth - playerDamage);
    const newMonsterHealth = Math.max(0, monsterHealth - monsterDamage);
    
    return {
      playerDamage,
      monsterDamage,
      playerHealthAfter: newPlayerHealth,
      monsterHealthAfter: newMonsterHealth,
      description: `Player attacks Covid Monster for ${monsterDamage} damage, but gets infected for ${playerDamage} damage`
    };
  },

  // Blast (Power attack)
  Blast: (playerHealth, monsterHealth) => {
    const playerDamage = generateRandomDamage(5, 15);
    const monsterDamage = generateRandomDamage(8, 20);
    
    const newPlayerHealth = Math.max(0, playerHealth - playerDamage);
    const newMonsterHealth = Math.max(0, monsterHealth - monsterDamage);
    
    return {
      playerDamage,
      monsterDamage,
      playerHealthAfter: newPlayerHealth,
      monsterHealthAfter: newMonsterHealth,
      description: `Player launches BLAST on Covid Monster for ${monsterDamage} damage, but suffers power infection for ${playerDamage} damage`
    };
  },

  // Healing
  heal: (playerHealth, monsterHealth) => {
    const healingAmount = generateRandomHealing(5, 15);
    const monsterDamage = generateRandomDamage(1, 8);
    
    const newPlayerHealth = Math.min(100, playerHealth + healingAmount);
    const newMonsterHealth = Math.max(0, monsterHealth - monsterDamage);
    
    return {
      playerDamage: monsterDamage,
      monsterDamage: 0,
      playerHealthAfter: newPlayerHealth,
      monsterHealthAfter: newMonsterHealth,
      healingAmount,
      description: `Player uses healing potion and recovers ${healingAmount} health, but Covid Monster attacks for ${monsterDamage} damage during healing`
    };
  },

  // Give up
  Giveup: (playerHealth, monsterHealth) => {
    return {
      playerDamage: 0,
      monsterDamage: 0,
      playerHealthAfter: playerHealth,
      monsterHealthAfter: monsterHealth,
      description: 'Player gives up to the Covid Monster'
    };
  }
};

// Check if game is over
const checkGameEnd = (playerHealth, monsterHealth, timeRemaining) => {
  if (playerHealth <= 0) {
    return { isOver: true, winner: 'monster', reason: 'Player defeated' };
  }
  
  if (monsterHealth <= 0) {
    return { isOver: true, winner: 'player', reason: 'Monster defeated' };
  }
  
  if (timeRemaining <= 0) {
    if (playerHealth < monsterHealth) {
      return { isOver: true, winner: 'monster', reason: 'Time up - Monster has more health' };
    } else if (monsterHealth < playerHealth) {
      return { isOver: true, winner: 'player', reason: 'Time up - Player has more health' };
    } else {
      return { isOver: true, winner: 'timeout', reason: 'Time up - Draw' };
    }
  }
  
  return { isOver: false };
};

// Generate game commentary
const generateCommentary = (action, result, playerName) => {
  const timestamp = new Date().toLocaleTimeString();
  
  switch (action) {
    case 'attack':
      return `${timestamp}: ${playerName} attacks Covid Monster for ${result.monsterDamage} damage, but gets infected for ${result.playerDamage} damage`;
    case 'Blast':
      return `${timestamp}: ${playerName} launches BLAST for ${result.monsterDamage} damage, suffers power infection for ${result.playerDamage} damage`;
    case 'heal':
      return `${timestamp}: ${playerName} uses healing potion (+${result.healingAmount} health), but Covid Monster attacks for ${result.playerDamage} damage`;
    case 'Giveup':
      return `${timestamp}: ${playerName} gives up to the Covid Monster`;
    case 'game_start':
      return `${timestamp}: Game started! ${playerName} vs Covid Monster`;
    case 'game_end':
      return `${timestamp}: Game ended! ${result.winner === 'player' ? playerName + ' wins!' : result.winner === 'monster' ? 'Covid Monster wins!' : 'Draw!'}`;
    default:
      return `${timestamp}: Unknown action`;
  }
};

module.exports = {
  gameActions,
  checkGameEnd,
  generateCommentary,
  generateRandomDamage,
  generateRandomHealing
};
