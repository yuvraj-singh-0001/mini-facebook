const express = require('express');
const router = express.Router();
const signupController = require('../controllers/auth/singup');
const loginController = require('../controllers/auth/login');
const profileController = require('../controllers/auth/profile');
const authMiddleware = require('../middleware/auth');

const friendsController = require('../controllers/friends');

router.post('/auth/signup', signupController.signup);
router.post('/auth/login', loginController.login);
router.put('/auth/profile-picture', authMiddleware, profileController.updateProfilePicture);
router.put('/auth/profile', authMiddleware, profileController.updateProfileDetails);
router.put('/auth/profile/public-mode', authMiddleware, profileController.togglePublicProfile);

// Friends Routes
router.post('/friends/request/:recipientId', authMiddleware, friendsController.sendRequest);
router.put('/friends/accept/:requesterId', authMiddleware, friendsController.acceptRequest);
router.delete('/friends/reject/:requesterId', authMiddleware, friendsController.rejectRequest);
router.delete('/friends/cancel/:recipientId', authMiddleware, friendsController.cancelRequest);
router.delete('/friends/unfriend/:friendId', authMiddleware, friendsController.unfriend);
router.get('/friends/list/:userId', authMiddleware, friendsController.getFriendsList);
router.get('/friends/mutual/:userId', authMiddleware, friendsController.getMutualFriends);
router.get('/friends/requests', authMiddleware, friendsController.getPendingRequests);
router.get('/users', authMiddleware, friendsController.getAllUsers);
router.get('/users/:userId', authMiddleware, friendsController.getUserProfile);

const postsController = require('../controllers/posts');
const commentsController = require('../controllers/comments');
const notificationsController = require('../controllers/notifications');

// Posts Routes
router.post('/posts', authMiddleware, postsController.createPost);
router.get('/posts/feed', authMiddleware, postsController.getFeed);
router.get('/posts/reels', authMiddleware, postsController.getReels);
router.get('/posts/user/:userId', authMiddleware, postsController.getUserPosts);
router.put('/posts/:postId/like', authMiddleware, postsController.likePost);
router.put('/posts/:postId/share', authMiddleware, postsController.sharePost);
router.put('/posts/:postId/view', authMiddleware, postsController.viewPost);
router.put('/posts/:postId/edit', authMiddleware, postsController.editPost);
router.delete('/posts/:postId', authMiddleware, postsController.deletePost);

// Comments Routes
router.post('/posts/:postId/comments', authMiddleware, commentsController.createComment);
router.get('/posts/:postId/comments', authMiddleware, commentsController.getComments);

// Notifications Routes
router.get('/notifications', authMiddleware, notificationsController.getNotifications);
router.put('/notifications/read', authMiddleware, notificationsController.markAsRead);
router.delete('/notifications/clear', authMiddleware, notificationsController.clearNotifications);

// Stories Routes
const storiesController = require('../controllers/stories');
router.post('/stories', authMiddleware, storiesController.createStory);
router.get('/stories/feed', authMiddleware, storiesController.getFeedStories);
router.put('/stories/:storyId/view', authMiddleware, storiesController.viewStory);
router.put('/stories/:storyId/like', authMiddleware, storiesController.likeStory);
router.get('/stories/:storyId/stats', authMiddleware, storiesController.getStoryStats);

// Chat Routes
const chatController = require('../controllers/chat');
router.get('/chat/conversations', authMiddleware, chatController.getConversations);
router.get('/chat/unread-count', authMiddleware, chatController.getUnreadCount);
router.get('/chat/messages/:friendId', authMiddleware, chatController.getMessages);
router.put('/chat/messages/:friendId/seen', authMiddleware, chatController.markAsSeen);
router.put('/chat/block/:friendId', authMiddleware, chatController.blockUser);
router.put('/chat/unblock/:friendId', authMiddleware, chatController.unblockUser);
// Admin Routes
const adminController = require('../controllers/admin');
const adminAuthMiddleware = require('../middleware/adminAuth');
router.get('/admin/stats', adminAuthMiddleware, adminController.getStats);
router.get('/admin/users', adminAuthMiddleware, adminController.getUsers);
router.get('/admin/posts', adminAuthMiddleware, adminController.getPosts);
router.get('/admin/users/:userId', adminAuthMiddleware, adminController.getUserDetails);
router.delete('/admin/posts/:postId', adminAuthMiddleware, adminController.deletePost);

module.exports = router;
