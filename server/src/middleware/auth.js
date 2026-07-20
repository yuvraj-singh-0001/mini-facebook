const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory user cache to avoid hitting MongoDB on every authenticated request
// This is the single biggest performance fix — every API call was waiting for User.findById
const userCache = new Map(); // key: userId, value: { user, expiresAt }
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCachedUser(userId) {
  const entry = userCache.get(userId);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.user;
  }
  if (entry) userCache.delete(userId);
  return null;
}

function setCachedUser(userId, user) {
  userCache.set(userId, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  // Prevent memory leak: cap cache size
  if (userCache.size > 500) {
    const firstKey = userCache.keys().next().value;
    userCache.delete(firstKey);
  }
}

// Export for use when user data changes (profile update, deactivation, etc.)
function invalidateUserCache(userId) {
  userCache.delete(userId);
}

const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Try cache first (avoids MongoDB round-trip)
    let user = getCachedUser(userId);
    if (!user) {
      user = await User.findById(userId).select('-password -avatar').maxTimeMS(10000).lean();
      if (user) setCachedUser(userId, user);
    }

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    
    if (req.user.isDeactivated) {
      if (req.user.deactivatedUntil && new Date() < new Date(req.user.deactivatedUntil)) {
        return res.status(403).json({ 
          message: 'Account deactivated due to policy violations.',
          deactivatedUntil: req.user.deactivatedUntil
        });
      } else if (req.user.deactivatedUntil && new Date() >= new Date(req.user.deactivatedUntil)) {
        // Ban expired, reactivate
        await User.findByIdAndUpdate(req.user._id, { isDeactivated: false, deactivatedUntil: null });
        req.user.isDeactivated = false;
        invalidateUserCache(userId);
      }
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = authMiddleware;
module.exports.invalidateUserCache = invalidateUserCache;
