const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    req.user = await User.findById(decoded.id).select('-password -avatar').lean();
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
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
      }
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = authMiddleware;
