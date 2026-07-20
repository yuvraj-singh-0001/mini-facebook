const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.createComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const content = (req.body.content || '').trim();
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    if (content.length > 500) {
      return res.status(400).json({ message: 'Comment is too long' });
    }

    const post = await Post.findById(postId).select('user').maxTimeMS(5000).lean();
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = new Comment({
      post: postId,
      user: userId,
      content
    });

    await newComment.save();
    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } }).maxTimeMS(5000);

    // Notify post owner
    if (post.user.toString() !== userId.toString()) {
      Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        referenceId: postId,
        message: `${req.user.firstName} ${req.user.lastName} commented on your post: "${content.substring(0, 30)}..."`
      }).catch(err => console.error('Comment notification failed:', err.message));
    }

    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'firstName lastName avatar gender')
      .maxTimeMS(5000)
      .lean();

    res.status(201).json({ message: 'Comment added', comment: populatedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating comment' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 30;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit + 1)
      .populate('user', 'firstName lastName avatar gender')
      .maxTimeMS(5000)
      .lean();

    const hasMore = comments.length > limit;
    res.status(200).json({ comments: hasMore ? comments.slice(0, limit) : comments, page, hasMore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};
