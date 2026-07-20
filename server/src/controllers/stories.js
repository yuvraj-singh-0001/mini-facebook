const Story = require('../models/Story');
const Friendship = require('../models/Friendship');
const { getCachedFriendIds } = require('./posts');

exports.createStory = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user._id;

    if (!image) {
      return res.status(400).json({ message: 'Image is required for a story' });
    }

    const newStory = new Story({
      user: userId,
      image
    });

    await newStory.save();
    
    const populatedStory = await Story.findById(newStory._id).populate('user', 'firstName lastName avatar gender').lean();

    res.status(201).json({ message: 'Story created', story: populatedStory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating story' });
  }
};

exports.getFeedStories = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get friends from cache (avoids separate MongoDB roundtrip)
    const friendIds = await getCachedFriendIds(userId);
    const storyUserIds = [...friendIds, userId];

    // Only get stories that haven't expired
    const activeStories = await Story.find({
      user: { $in: storyUserIds },
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: 1 }) // oldest active first per user looks better in story viewer, but we group them anyway
    .limit(100)
    .maxTimeMS(8000)
    .populate('user', 'firstName lastName avatar gender')
    .lean();

    // Group stories by user
    const userGroups = {};
    activeStories.forEach(story => {
      const uId = story.user._id.toString();
      if (!userGroups[uId]) {
        userGroups[uId] = {
          user: story.user,
          stories: [],
          hasUnseen: false
        };
      }
      userGroups[uId].stories.push(story);
      
      // If the current user hasn't viewed this story, mark hasUnseen
      if (uId !== userId.toString()) {
        const hasViewed = story.viewers.some(vId => vId.toString() === userId.toString());
        if (!hasViewed) {
          userGroups[uId].hasUnseen = true;
        }
      }
    });

    // Format to array
    let groupedStories = Object.values(userGroups);

    // Put current user's group first if exists, then sort by unseen
    const currentUserGroup = groupedStories.find(g => g.user._id.toString() === userId.toString());
    const others = groupedStories.filter(g => g.user._id.toString() !== userId.toString());
    
    // Sort others: unseen first, then by latest story
    others.sort((a, b) => {
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      const latestA = a.stories[a.stories.length - 1].createdAt;
      const latestB = b.stories[b.stories.length - 1].createdAt;
      return new Date(latestB).getTime() - new Date(latestA).getTime();
    });

    const finalResult = currentUserGroup ? [currentUserGroup, ...others] : others;

    res.status(200).json({ storyGroups: finalResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stories' });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user._id;

    // Use $addToSet to ensure uniqueness at the DB level
    // Condition user: { $ne: userId } prevents counting own views
    await Story.findOneAndUpdate(
      { _id: storyId, user: { $ne: userId } },
      { $addToSet: { viewers: userId } }
    ).maxTimeMS(5000);

    res.status(200).json({ message: 'Story viewed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error viewing story' });
  }
};

exports.likeStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user._id;

    const story = await Story.findById(storyId).select('user likes').maxTimeMS(5000);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const hasLiked = story.likes.some(id => id.toString() === userId.toString());

    if (!hasLiked) {
      await Story.updateOne({ _id: storyId }, { $addToSet: { likes: userId } }).maxTimeMS(5000);

      if (story.user.toString() !== userId.toString()) {
        const senderUser = req.user;
        require('../models/Notification').create({
          recipient: story.user,
          sender: userId,
          type: 'like',
          referenceId: storyId,
          message: `${senderUser.firstName} ${senderUser.lastName} liked your story.`
        }).catch(err => console.error('Story like notification failed:', err.message));
      }
    }

    res.status(200).json({ message: 'Story liked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error liking story' });
  }
};

exports.getStoryStats = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user._id;

    const story = await Story.findById(storyId)
      .populate('viewers', 'firstName lastName avatar')
      .populate('likes', 'firstName lastName avatar')
      .maxTimeMS(8000)
      .lean();

    if (!story) return res.status(404).json({ message: 'Story not found' });
    
    if (story.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only view stats for your own stories' });
    }

    // Deduplicate in case there was older corrupt data with duplicates
    const uniqueViewers = Array.from(new Map(story.viewers.map(v => [v._id.toString(), v])).values());
    const uniqueLikes = Array.from(new Map(story.likes.map(l => [l._id.toString(), l])).values());

    res.status(200).json({ 
      viewers: uniqueViewers,
      viewCount: uniqueViewers.length,
      likes: uniqueLikes,
      likeCount: uniqueLikes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching story stats' });
  }
};
