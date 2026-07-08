const Post = require('../models/Post');
const Friendship = require('../models/Friendship');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');

// Friendship cache — friendships change very rarely, no need to re-query on every scroll
const friendsCache = new Map(); // key: userId, value: { friendIds, expiresAt }
const FRIENDS_CACHE_TTL = 10 * 1000; // 10 seconds

async function getCachedFriendIds(userId) {
  const key = userId.toString();
  const cached = friendsCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.friendIds;
  }

  const friendships = await Friendship.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted'
  }).select('requester recipient').lean();

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

    const newPost = new Post({
      user: userId,
      content,
      image,
      video,
      mediaType: mediaType || (video ? 'reel' : 'post'),
      viewedBy: [userId],
      viewsCount: 1
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
    const populatedPost = await Post.findById(newPost._id).populate('user', 'firstName lastName avatar').lean();

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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get friends (cached for 10s to avoid repeat queries on pagination)
    const friendIds = await getCachedFriendIds(userId);
    
    // Include user's own posts in the feed
    const feedUserIds = [...friendIds, userId];

    // Fetch posts — exclude viewedBy AND likes array (we only need hasLiked + count)
    const posts = await Post.find({ user: { $in: feedUserIds } })
      .select('-viewedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .populate('user', 'firstName lastName avatar')
      .lean();

    const hasMore = posts.length > limit;
    const postsPage = hasMore ? posts.slice(0, limit) : posts;

    // Get comments count in parallel
    const postIds = postsPage.map(p => p._id);
    const comments = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    // Build fast lookup map
    const commentMap = {};
    comments.forEach(c => { commentMap[c._id.toString()] = c.count; });

    const formattedPosts = postsPage.map(post => {
      const { likes, ...rest } = post; // Strip likes array from response
      return {
        ...rest,
        commentsCount: commentMap[post._id.toString()] || 0,
        hasLiked: likes.some(id => id.toString() === userId.toString()),
        likesCount: likes.length,
        viewsCount: post.viewsCount || 0
      };
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
      .populate('user', 'firstName lastName avatar')
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
        likesCount: likes.length,
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

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const hasLiked = post.likes.includes(userId);
    if (hasLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      
      // Notify post owner
      if (post.user.toString() !== userId.toString()) {
        const notification = new Notification({
          recipient: post.user,
          sender: userId,
          type: 'like',
          referenceId: post._id,
          message: `${req.user.firstName} ${req.user.lastName} liked your post.`
        });
        await notification.save();
      }
    }

    await post.save();
    res.status(200).json({ message: hasLiked ? 'Unliked' : 'Liked', likesCount: post.likes.length });
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
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const hasViewed = post.viewedBy && post.viewedBy.some(id => id.toString() === userId.toString());
    if (!hasViewed) {
      post.viewedBy = post.viewedBy || [];
      post.viewedBy.push(userId);
      post.viewsCount = post.viewedBy.length;
      await post.save();
    } else {
      post.viewsCount = post.viewedBy ? post.viewedBy.length : 0;
      if (post.isModified('viewsCount')) await post.save();
    }

    res.status(200).json({ message: 'View recorded', viewsCount: post.viewedBy ? post.viewedBy.length : 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error recording view' });
  }
};

exports.getReels = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName avatar isOnline')
      .lean();

    if (reels.length === 0) {
      return res.status(200).json({ reels: [] });
    }

    // Run comment count aggregation only for fetched reels (not ALL reels)
    const reelIds = reels.map(r => r._id);
    const comments = await Comment.aggregate([
      { $match: { post: { $in: reelIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

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
        likesCount,
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




