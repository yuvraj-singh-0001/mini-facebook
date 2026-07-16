const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const res = await User.updateMany(
    { $or: [{ avatar: '/default-avatar.svg' }, { avatar: { $regex: 'dicebear' } }] },
    { $set: { avatar: '' } }
  );
  console.log('Updated old users with default avatars:', res);
  mongoose.disconnect();
}).catch(console.error);
