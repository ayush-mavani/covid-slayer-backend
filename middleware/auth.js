const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers first
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies if not found in headers
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    console.log("req.headers.authorization", req.headers.authorization);
    console.log(
      "req.cookies.token",
      req.cookies.token ? "present" : "not present"
    );

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Token is valid but user no longer exists",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.log("error", error);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Generate JWT token
exports.generateToken = (id) => {
  const expireDays = parseInt(process.env.JWT_EXPIRE || "7");
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: `${expireDays}d`,
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = exports.generateToken(user._id);

  // Parse JWT_EXPIRE (e.g., "7" -> 7 days in milliseconds)
  const expireDays = parseInt(process.env.JWT_EXPIRE || "7");
  const expireTime = expireDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  console.log("JWT_EXPIRE:", process.env.JWT_EXPIRE);
  console.log("Token expires in:", expireDays, "days");

  const options = {
    expires: new Date(Date.now() + expireTime),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        winRate: user.winRate,
      },
    });
};
