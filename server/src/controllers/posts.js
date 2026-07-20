const Post = require('../models/Post');
const Friendship = require('../models/Friendship');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');

// Friendship cache — friendships change very rarely, no need to re-query on every scroll
const friendsCache = new Map(); // key: userId, value: { friendIds, expiresAt }
const FRIENDS_CACHE_TTL = 10 * 1000; // 10 seconds
const MAX_FEED_LIMIT = 5;
const MAX_REELS_LIMIT = 10;
const MAX_INLINE_IMAGE_CHARS = 900_000;
const MAX_IMAGE_UPLOAD_CHARS = 8_000_000;

function isBase64Data(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

function trimHeavyFeedMedia(post) {
  if (isBase64Data(post.image) && post.image.length > MAX_INLINE_IMAGE_CHARS) {
    post.image = '';
    post.imageSkipped = true;
  }
  return post;
}

async function getCachedFriendIds(userId) {
  const key = userId.toString();
  const cached = friendsCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.friendIds;
  }

  const friendships = await Friendship.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted'
  }).select('requester recipient').maxTimeMS(5000).lean();

  const friendIds = friendships.map(f =>
    f.requester.toString() === key ? f.recipient : f.requester
  );

  friendsCache.set(key, { friendIds, expiresAt: Date.now() + FRIENDS_CACHE_TTL });
  return friendIds;
}

exports.createPost = async (req, res) => {
  try {
    const { content, image, video, mediaType } = req.body;
    const userId = req.user._id;

    if (!content && !image && !video) {
      return res.status(400).json({ message: 'Post must have text, image, or video' });
    }
    if (isBase64Data(video)) {
      return res.status(400).json({ message: 'Please upload videos as a URL. Direct video files are too heavy for feed performance.' });
    }
    if (isBase64Data(image) && image.length > MAX_IMAGE_UPLOAD_CHARS) {
      return res.status(400).json({ message: 'Image is too large. Please upload an image under 5MB.' });
    }

    const newPost = new Post({
      user: userId,
      content,
      image,
      video,
      mediaType: mediaType || (video ? 'reel' : 'post'),
      viewedBy: [userId],
      viewsCount: 1,
      likesCount: 0,
      commentsCount: 0,
      isOfficial: userId.toString() === '6a59dbe1d7d3d61365e278cb'
    });

    await newPost.save();

    // Fetch user details for notification
    const user = req.user; // from auth middleware
    
    // Find all friends to notify them
    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    }).lean();

    const friendIds = friendships.map(f => 
      f.requester.toString() === userId.toString() ? f.recipient : f.requester
    );

    if (friendIds.length > 0) {
      const notifications = friendIds.map(friendId => ({
        recipient: friendId,
        sender: userId,
        type: 'post',
        referenceId: newPost._id,
        message: video || mediaType === 'reel' ? `${user.firstName} ${user.lastName} shared a new Reel 🎬!` : `${user.firstName} ${user.lastName} just posted: ${content ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : 'A new photo.'}`
      }));
      
      // Bulk insert for high performance scalability
      await Notification.insertMany(notifications);
    }

    // Return populated post
    const populatedPost = await Post.findById(newPost._id).populate('user', 'firstName lastName avatar gender isVerified').lean();

    res.status(201).json({ message: 'Post created', post: populatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating post' });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const requestedLimit = parseInt(req.query.limit) || 5;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_FEED_LIMIT);
    const skip = (page - 1) * limit;

    // Get friends (cached for 10s to avoid repeat queries on pagination)
    const friendIds = await getCachedFriendIds(userId);
    
    // Include user's own posts in the feed
    const feedUserIds = [...friendIds, userId];

    // Fetch posts — exclude viewedBy AND likes array (we only need hasLiked + count)
    const posts = await Post.find({
      user: { $in: feedUserIds },
      mediaType: { $nin: ['reel', 'video'] },
      video: { $in: ['', null] }
    })
      .select('user content image mediaType likes likesCount commentsCount sharesCount viewsCount isOfficial createdAt updatedAt editedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .maxTimeMS(5000)
      .populate('user', 'firstName lastName avatar gender isVerified')
      .lean();

    const hasMore = posts.length > limit;
    const postsPage = hasMore ? posts.slice(0, limit) : posts;

    const formattedPosts = postsPage.map(post => {
      const { likes, ...rest } = post; // Strip likes array from response
      return trimHeavyFeedMedia({
        ...rest,
        commentsCount: post.commentsCount || 0,
        hasLiked: likes?.some(id => id.toString() === userId.toString()) || false,
        likesCount: post.likesCount || likes?.length || 0,
        viewsCount: post.viewsCount || 0
      });
    });

    res.status(200).json({ 
      posts: formattedPosts, 
      hasMore,
      page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: targetUserId })
      .select('-viewedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName avatar gender isVerified')
      .lean();

    // Get comments count for each post
    const postIds = posts.map(p => p._id);
    const comments = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const commentMap = {};
    comments.forEach(c => { commentMap[c._id.toString()] = c.count; });

    const formattedPosts = posts.map(post => {
      const { likes, ...rest } = post;
      return {
        ...rest,
        commentsCount: commentMap[post._id.toString()] || 0,
        hasLiked: likes.some(id => id.toString() === currentUserId.toString()),
        likesCount: post.likesCount || likes.length,
        viewsCount: post.viewsCount || 0
      };
    });

    res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user posts' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    let updatedPost = await Post.findOneAndUpdate(
      { _id: postId, likes: userId },
      { $pull: { likes: userId }, $inc: { likesCount: -1 } },
      { returnDocument: 'after' }
    ).select('user likes likesCount').maxTimeMS(5000).lean();

    if (updatedPost) {
      const exactLikesCount = updatedPost.likes?.length || 0;
      Post.updateOne({ _id: postId }, { $set: { likesCount: exactLikesCount } })
        .catch(err => console.error('likesCount sync failed:', err.message));
      return res.status(200).json({
        message: 'Unliked',
        hasLiked: false,
        likesCount: exactLikesCount
      });
    }

    updatedPost = await Post.findOneAndUpdate(
      { _id: postId, likes: { $ne: userId } },
      { $addToSet: { likes: userId }, $inc: { likesCount: 1 } },
      { returnDocument: 'after' }
    ).select('user likes likesCount').maxTimeMS(5000).lean();

    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    const exactLikesCount = updatedPost.likes?.length || 0;
    Post.updateOne({ _id: postId }, { $set: { likesCount: exactLikesCount } })
      .catch(err => console.error('likesCount sync failed:', err.message));

    if (updatedPost.user.toString() !== userId.toString()) {
      Notification.create({
        recipient: updatedPost.user,
        sender: userId,
        type: 'like',
        referenceId: updatedPost._id,
        message: `${req.user.firstName} ${req.user.lastName} liked your post.`
      }).catch(err => console.error('Like notification failed:', err.message));
    }

    res.status(200).json({
      message: 'Liked',
      hasLiked: true,
      likesCount: exactLikesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error liking post' });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { recipientId } = req.body;
    const senderId = req.user._id;

    // Increment share count
    const post = await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } }, { returnDocument: 'after' });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Send notification if a specific recipient was chosen
    if (recipientId && recipientId !== senderId.toString()) {
      const senderUser = await require('../models/User').findById(senderId).lean();
      
      const notification = new Notification({
        recipient: recipientId,
        sender: senderId,
        type: 'post',
        referenceId: post._id,
        message: `${senderUser.firstName} ${senderUser.lastName} shared a post with you.`
      });
      await notification.save();
    }

    res.status(200).json({ message: 'Shared', sharesCount: post.sharesCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error sharing post' });
  }
};

exports.viewPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId, user: { $ne: userId }, viewedBy: { $ne: userId } },
      { $addToSet: { viewedBy: userId }, $inc: { viewsCount: 1 } },
      { returnDocument: 'after' }
    ).select('viewsCount').maxTimeMS(5000).lean();

    if (updatedPost) {
      return res.status(200).json({ message: 'View recorded', viewsCount: updatedPost.viewsCount || 0 });
    }

    const post = await Post.findById(postId).select('viewsCount').maxTimeMS(5000).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json({ message: 'View already recorded', viewsCount: post.viewsCount || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error recording view' });
  }
};

exports.getReels = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const requestedLimit = parseInt(req.query.limit) || 6;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_REELS_LIMIT);
    const skip = (page - 1) * limit;

    // Single optimized query: filter + sort + paginate + populate in MongoDB
    // Exclude heavy base64 fields from initial fetch for speed
    const reels = await Post.find({
      $or: [
        { mediaType: { $in: ['reel', 'video'] } },
        { video: { $exists: true, $ne: '' } }
      ]
    })
      .select('-viewedBy') // Don't load the full viewedBy array - saves memory/bandwidth
      .sort({ isOfficial: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .maxTimeMS(8000)
      .populate('user', 'firstName lastName avatar isOnline gender isVerified')
      .lean();

    if (reels.length === 0) {
      return res.status(200).json({ reels: [] });
    }

    // Run comment count aggregation only for fetched reels (not ALL reels)
    const reelIds = reels.map(r => r._id);
    const comments = await Comment.aggregate([
      { $match: { post: { $in: reelIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]).option({ maxTimeMS: 5000 });

    // Build a fast lookup map instead of .find() per reel
    const commentMap = {};
    comments.forEach(c => { commentMap[c._id.toString()] = c.count; });

    const enrichedReels = reels.map(reel => {
      const { likes, ...rest } = reel;
      const likesCount = likes?.length || 0;
      return {
        ...rest,
        commentsCount: commentMap[reel._id.toString()] || 0,
        hasLiked: likes?.some(id => id.toString() === userId.toString()) || false,
        likesCount: reel.likesCount || likesCount,
        viewsCount: reel.viewsCount || 0
      };
    });

    res.status(200).json({ reels: enrichedReels });
  } catch (error) {
    console.error('Error fetching reels:', error);
    res.status(500).json({ message: 'Server error fetching reels feed' });
  }
};

exports.getCachedFriendIds = getCachedFriendIds;

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only the post owner can delete
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    // Also delete all comments on this post
    await Comment.deleteMany({ post: postId });

    // Also delete related notifications
    await Notification.deleteMany({ referenceId: postId });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};

exports.editPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;
    const { content } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only the post owner can edit
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    post.content = content !== undefined ? content : post.content;
    post.editedAt = new Date();
    await post.save();

    const updatedPost = await Post.findById(postId).populate('user', 'firstName lastName avatar gender isVerified').lean();

    res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error editing post' });
  }
};




