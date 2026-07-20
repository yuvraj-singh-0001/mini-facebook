const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'firstName lastName avatar gender')
      .maxTimeMS(5000)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false }).maxTimeMS(5000);

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    ).maxTimeMS(5000);
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notifications as read' });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ recipient: userId }).maxTimeMS(5000);
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error clearing notifications' });
  }
};
