const adminAuthMiddleware = (req, res, next) => {
  const pin = req.headers['x-admin-pin'];

  if (!pin) {
    return res.status(401).json({ message: 'Not authorized, no admin pin provided' });
  }

  // Check if PIN is correct
  if (pin !== '7055') {
    return res.status(401).json({ message: 'Not authorized, incorrect admin pin' });
  }

  next();
};

module.exports = adminAuthMiddleware;
