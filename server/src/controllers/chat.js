const Message = require('../models/Message');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const mongoose = require('mongoose');

// Get all active conversations (friends we chatted with, or just friends)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    // For simplicity, let's just return all friends. 
    // In a real app, you might want to return only those with whom you have messages.
    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    }).populate('requester', 'firstName lastName avatar isOnline lastSeen isVerified')
      .populate('recipient', 'firstName lastName avatar isOnline lastSeen isVerified');

    const friends = friendships.map(f => {
      return f.requester._id.toString() === userId.toString() ? f.recipient : f.requester;
    });

    // Also get the last message for each friend to display in the list
    const conversations = await Promise.all(friends.map(async (friend) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: friend._id },
          { sender: friend._id, receiver: userId }
        ],
        isDeletedForMe: { $ne: userId },
        isDeletedForEveryone: false
      }).sort({ createdAt: -1 });

      // Unread count
      const unreadCount = await Message.countDocuments({
        sender: friend._id,
        receiver: userId,
        status: { $ne: 'seen' },
        isDeletedForEveryone: false
      });

      return {
        friend,
        lastMessage,
        unreadCount
      };
    }));

    // Sort conversations by last message date
    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return dateB - dateA;
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get total unread messages count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      status: { $ne: 'seen' },
      isDeletedForEveryone: false
    });
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a specific user
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ],
      isDeletedForMe: { $ne: userId }, // Not deleted for me
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as seen
exports.markAsSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    await Message.updateMany(
      { sender: friendId, receiver: userId, status: { $ne: 'seen' } },
      { $set: { status: 'seen' } }
    );

    res.status(200).json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Error marking as seen:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: friendId }
    });

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: friendId }
    });

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
