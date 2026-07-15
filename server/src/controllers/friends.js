const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Send a friend request
exports.sendRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const recipientId = req.params.recipientId;

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId).lean();
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if relationship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    }).lean();

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends' });
      } else {
        return res.status(400).json({ message: 'Friend request already exists' });
      }
    }

    const newRequest = new Friendship({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    await newRequest.save();

    // Create notification (non-blocking — don't fail the whole request if this errors)
    try {
      const senderUser = await User.findById(requesterId).lean();
      if (senderUser) {
        await new Notification({
          recipient: recipientId,
          sender: requesterId,
          type: 'friend_request',
          message: `${senderUser.firstName} ${senderUser.lastName} sent you a friend request.`
        }).save();
      }
    } catch (notifErr) {
      console.error('Notification creation failed (non-fatal):', notifErr.message);
    }

    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept a friend request
exports.acceptRequest = async (req, res) => {
  try {
    const recipientId = req.user._id;
    const requesterId = req.params.requesterId;

    const request = await Friendship.findOneAndUpdate(
      { requester: requesterId, recipient: recipientId, status: 'pending' },
      { status: 'accepted' },
      { returnDocument: 'after' }
    );

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Create notification (non-blocking)
    try {
      const senderUser = await User.findById(recipientId).lean();
      if (senderUser) {
        await new Notification({
          recipient: requesterId,
          sender: recipientId,
          type: 'friend_request',
          message: `${senderUser.firstName} ${senderUser.lastName} accepted your friend request.`
        }).save();
      }
    } catch (notifErr) {
      console.error('Notification creation failed (non-fatal):', notifErr.message);
    }

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject a friend request (from recipient's side)
exports.rejectRequest = async (req, res) => {
  try {
    const recipientId = req.user._id;
    const requesterId = req.params.requesterId;

    const request = await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a friend request (from requester's side)
exports.cancelRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const recipientId = req.params.recipientId;

    const request = await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    res.status(200).json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfriend
exports.unfriend = async (req, res) => {
  try {
    const userId1 = req.user._id;
    const userId2 = req.params.friendId;

    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: userId1, recipient: userId2, status: 'accepted' },
        { requester: userId2, recipient: userId1, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    res.status(200).json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Friends List
exports.getFriendsList = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const friendships = await Friendship.find({
      $or: [{ requester: targetUserId }, { recipient: targetUserId }],
      status: 'accepted'
    }).populate('requester recipient', 'firstName lastName avatar emailOrPhone isOnline lastSeen').lean();

    // If viewing someone else's friend list, check which of those friends the requester is actually friends with
    let currentUserFriendIds = new Set();
    if (currentUserId.toString() !== targetUserId.toString()) {
      const myFriendships = await Friendship.find({
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
        status: 'accepted'
      }).select('requester recipient').lean();
      myFriendships.forEach(f => {
        currentUserFriendIds.add(f.requester.toString() === currentUserId.toString() ? f.recipient.toString() : f.requester.toString());
      });
    }

    const friendsList = friendships.map(f => {
      // Determine which one is the friend
      const friend = f.requester._id.toString() === targetUserId.toString() ? f.recipient : f.requester;
      const isMyFriend = currentUserId.toString() === targetUserId.toString() || currentUserFriendIds.has(friend._id.toString());
      return {
        id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        name: `${friend.firstName} ${friend.lastName}`,
        avatar: friend.avatar,
        isOnline: isMyFriend ? (friend.isOnline || false) : false,
        lastSeen: isMyFriend ? friend.lastSeen : null
      };
    });

    res.status(200).json({ friends: friendsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Mutual Friends
exports.getMutualFriends = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: 'Cannot find mutual friends with yourself' });
    }

    // Get current user's friends
    const currentUserFriendships = await Friendship.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      status: 'accepted'
    }).select('requester recipient').lean();

    const currentUserFriendIds = currentUserFriendships.map(f => 
      f.requester.toString() === currentUserId.toString() ? f.recipient.toString() : f.requester.toString()
    );

    // Get target user's friends
    const targetUserFriendships = await Friendship.find({
      $or: [{ requester: targetUserId }, { recipient: targetUserId }],
      status: 'accepted'
    }).populate('requester recipient', 'firstName lastName avatar').lean();

    const mutualFriends = [];

    targetUserFriendships.forEach(f => {
      const friend = f.requester._id.toString() === targetUserId.toString() ? f.recipient : f.requester;
      if (currentUserFriendIds.includes(friend._id.toString())) {
        mutualFriends.push({
          id: friend._id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          name: `${friend.firstName} ${friend.lastName}`,
          avatar: friend.avatar,
        });
      }
    });

    res.status(200).json({ mutualFriends });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Pending Requests (Incoming)
exports.getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const requests = await Friendship.find({
      recipient: currentUserId,
      status: 'pending'
    }).populate('requester', 'firstName lastName avatar').lean();

    const formattedRequests = requests.map(f => ({
      requestId: f._id,
      requester: {
        id: f.requester._id,
        firstName: f.requester.firstName,
        lastName: f.requester.lastName,
        name: `${f.requester.firstName} ${f.requester.lastName}`,
        avatar: f.requester.avatar,
      }
    }));

    res.status(200).json({ requests: formattedRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Users (for testing / discovering friends / searching)
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const search = req.query.search || req.query.q;

    const query = { _id: { $ne: currentUserId } };

    if (search && search.trim() !== '') {
      const terms = search.trim().split(/\s+/);
      const termRegexes = terms.map(t => new RegExp(t, 'i'));
      query.$and = termRegexes.map(regex => ({
        $or: [{ firstName: regex }, { lastName: regex }]
      }));
    }

    // Get all users except current user (limited to 20 if searching, else 100)
    const users = await User.find(query)
      .select('firstName lastName avatar isOnline lastSeen isPublicProfile')
      .limit(search ? 20 : 100)
      .lean();

    // Optionally attach relationship status to each user
    const friendships = await Friendship.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }]
    }).lean();

    const formattedUsers = users.map(u => {
      let status = 'none';
      const f = friendships.find(fr => 
        (fr.requester.toString() === u._id.toString() && fr.recipient.toString() === currentUserId.toString()) ||
        (fr.recipient.toString() === u._id.toString() && fr.requester.toString() === currentUserId.toString())
      );
      
      if (f) {
        if (f.status === 'accepted') status = 'friends';
        else if (f.requester.toString() === currentUserId.toString()) status = 'request_sent';
        else status = 'request_received';
      }

      return {
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.avatar,
        isOnline: status === 'friends' ? (u.isOnline || false) : false,
        lastSeen: status === 'friends' ? u.lastSeen : null,
        isPublicProfile: u.isPublicProfile || false,
        status
      };
    });

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId).select('-password').lean();
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let status = 'none';
    if (currentUserId.toString() !== targetUserId.toString()) {
      const f = await Friendship.findOne({
        $or: [
          { requester: currentUserId, recipient: targetUserId },
          { requester: targetUserId, recipient: currentUserId }
        ]
      }).lean();

      if (f) {
        if (f.status === 'accepted') status = 'friends';
        else if (f.requester.toString() === currentUserId.toString()) status = 'request_sent';
        else status = 'request_received';
      }
    } else {
      status = 'self';
    }

    res.status(200).json({
      user: {
        id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        avatar: targetUser.avatar,
        bio: targetUser.bio,
        workplace: targetUser.workplace,
        education: targetUser.education,
        location: targetUser.location,
        hometown: targetUser.hometown,
        relationshipStatus: targetUser.relationshipStatus,
        isPublicProfile: targetUser.isPublicProfile || false,
        createdAt: targetUser.createdAt,
        isOnline: (status === 'friends' || status === 'self') ? (targetUser.isOnline || false) : false,
        lastSeen: (status === 'friends' || status === 'self') ? targetUser.lastSeen : null,
        status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
