// MongoDB initialization script
db = db.getSiblingDB('covid-slayer');

// Create collections
db.createCollection('users');
db.createCollection('games');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "gamesPlayed": -1, "gamesWon": -1 });

db.games.createIndex({ "player": 1, "createdAt": -1 });
db.games.createIndex({ "status": 1 });
db.games.createIndex({ "createdAt": -1 });

// Create a default admin user (optional)
db.users.insertOne({
  fullName: "Admin User",
  email: "admin@covidslayer.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Qj8K8K8K8", // password: admin123
  avatar: "https://via.placeholder.com/150/007bff/ffffff?text=Admin",
  gamesPlayed: 0,
  gamesWon: 0,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  createdAt: new Date(),
  lastLogin: new Date()
});

print('MongoDB initialization completed successfully!');
