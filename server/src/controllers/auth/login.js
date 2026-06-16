const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Find user
    const user = await User.findOne({ emailOrPhone }).lean();
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if deactivated
    if (user.isDeactivated) {
      if (user.deactivatedUntil && new Date() < new Date(user.deactivatedUntil)) {
        return res.status(403).json({ 
          message: `Your account is temporarily suspended until ${new Date(user.deactivatedUntil).toLocaleString()} due to policy violations.`
        });
      } else if (user.deactivatedUntil && new Date() >= new Date(user.deactivatedUntil)) {
        // Ban expired, remove it in DB but let them log in
        await User.findByIdAndUpdate(user._id, { isDeactivated: false, deactivatedUntil: null });
      }
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailOrPhone: user.emailOrPhone,
        avatar: user.avatar,
        bio: user.bio,
        workplace: user.workplace,
        education: user.education,
        location: user.location,
        hometown: user.hometown,
        relationshipStatus: user.relationshipStatus,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
