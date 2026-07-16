const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, emailOrPhone, password, dobDay, dobMonth, dobYear, gender } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ emailOrPhone }).lean();
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      emailOrPhone,
      password: hashedPassword,
      dobDay,
      dobMonth,
      dobYear,
      gender
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        emailOrPhone: newUser.emailOrPhone,
        avatar: newUser.avatar,
        bio: newUser.bio,
        workplace: newUser.workplace,
        education: newUser.education,
        location: newUser.location,
        hometown: newUser.hometown,
        relationshipStatus: newUser.relationshipStatus,
        isPublicProfile: newUser.isPublicProfile || false,
        gender: newUser.gender,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

