const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.createComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = new Comment({
      post: postId,
      user: userId,
      content
    });

    await newComment.save();

    // Notify post owner
    if (post.user.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        referenceId: post._id,
        message: `${req.user.firstName} ${req.user.lastName} commented on your post: "${content.substring(0, 30)}..."`
      });
      await notification.save();
    }

    const populatedComment = await Comment.findById(newComment._id).populate('user', 'firstName lastName avatar gender').lean();

    res.status(201).json({ message: 'Comment added', comment: populatedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating comment' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('user', 'firstName lastName avatar gender')
      .lean();

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};
