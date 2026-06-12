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

module.exports = router;
