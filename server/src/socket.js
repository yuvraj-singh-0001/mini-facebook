const { Server } = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
const BadWord = require('./models/BadWord');
const ModerationLog = require('./models/ModerationLog');
const mongoose = require('mongoose');

const setupSocket = (server) => {
  const io = new Server(server, {
    maxHttpBufferSize: 5e6,
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  const onlineUsers = new Map(); // socket.id -> userId
  const userConnectionCounts = new Map(); // userId -> active socket count
  let badWordsCache = { words: [], expiresAt: 0 };

  async function getBadWords() {
    if (Date.now() < badWordsCache.expiresAt) {
      return badWordsCache.words;
    }

    const words = await BadWord.find({})
      .select('word category')
      .maxTimeMS(5000)
      .lean();
    badWordsCache = { words, expiresAt: Date.now() + 5 * 60 * 1000 };
    return words;
  }

  function isDbReady() {
    return mongoose.connection.readyState === 1;
  }

  io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // When user logs in or connects, they join their own room using their userId
    socket.on('setup', async (userId) => {
      socket.join(userId);
      onlineUsers.set(socket.id, userId);

      const currentCount = userConnectionCounts.get(userId) || 0;
      userConnectionCounts.set(userId, currentCount + 1);

      if (currentCount === 0 && isDbReady()) {
        await User.findByIdAndUpdate(userId, { isOnline: true }).maxTimeMS(5000);
        socket.broadcast.emit('user_status_change', { userId, isOnline: true });
      }
      
      console.log(`User ${userId} joined room ${userId}`);
    });

    // Send Message
    socket.on('send_message', async (data, callback) => {
      try {
        if (!isDbReady()) {
          return callback?.({ status: 'error', error: 'Server database is connecting. Please retry.' });
        }
        const { sender, receiver, content, type, imageUrl } = data;
        if (type === 'text' && (!content || content.length > 1000)) {
          return callback?.({ status: 'error', error: 'Message is too long.' });
        }
        
        if (type === 'text' && content) {
          const badWordsData = await getBadWords();
          
          const lowerContent = content.toLowerCase();
          // Remove ALL non-alphanumeric characters (spaces, symbols, emojis, etc.) but keep letters from all languages
          const normalizedContent = lowerContent.replace(/[^\p{L}\p{N}]/gu, '');
          
          const caughtWords = [];
          const caughtCategories = [];
          
          badWordsData.forEach(bw => {
            const word = bw.word.toLowerCase();
            const normalizedWord = word.replace(/[^\p{L}\p{N}]/gu, '');
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            // Match exact word boundaries OR match anywhere in the stripped string
            if (regex.test(lowerContent) || normalizedContent.includes(normalizedWord)) {
              caughtWords.push(word);
              if (!caughtCategories.includes(bw.category)) {
                caughtCategories.push(bw.category);
              }
            }
          });
          
          if (caughtWords.length > 0) {
            await ModerationLog.create({
              userId: sender,
              attemptedMessage: content,
              caughtWords,
              caughtCategories
            });
            
            const offenseCount = await ModerationLog.countDocuments({ userId: sender }).maxTimeMS(5000);
            let isDeactivated = false;
            
            if (offenseCount > 3) {
              const until = new Date();
              until.setHours(until.getHours() + 24);
              await User.findByIdAndUpdate(sender, {
                isDeactivated: true,
                deactivatedUntil: until
              });
              isDeactivated = true;
            }
            
            if (callback) {
              return callback({ 
                status: 'profanity_error', 
                error: 'Message blocked due to profanity.',
                caughtWords,
                caughtCategories,
                isDeactivated
              });
            }
            return;
          }
        }

        
        // Save to DB
        const newMessage = new Message({
          sender,
          receiver,
          content,
          type,
          imageUrl,
          status: 'sent'
        });
        
        const savedMessage = await newMessage.save();

        // Check if receiver is online in sockets
        let isReceiverOnline = false;
        for (const [sId, uId] of onlineUsers.entries()) {
          if (uId === receiver) {
            isReceiverOnline = true;
            break;
          }
        }

        if (isReceiverOnline) {
          savedMessage.status = 'delivered';
          await Message.updateOne({ _id: savedMessage._id }, { $set: { status: 'delivered' } }).maxTimeMS(5000);
        }

        // Emit to receiver's room
        socket.to(receiver).emit('receive_message', savedMessage);
        
        if (callback) {
          callback({ status: 'ok', message: savedMessage });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (callback) {
          callback({ status: 'error', error: error.message });
        }
      }
    });

    // Typing indicators
    socket.on('typing', ({ sender, receiver }) => {
      socket.to(receiver).emit('typing', { sender });
    });

    socket.on('stop_typing', ({ sender, receiver }) => {
      socket.to(receiver).emit('stop_typing', { sender });
    });

    // Message status updates
    socket.on('message_seen', async ({ messageIds, sender, receiver }) => {
      try {
        if (!isDbReady()) return;
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: 'seen' } }
        ).maxTimeMS(5000);
        socket.to(receiver).emit('messages_seen_update', { messageIds, receiver: sender });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    socket.on('delete_for_me', async ({ messageId, userId }) => {
      try {
        if (!isDbReady()) return;
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { isDeletedForMe: userId }
        }).maxTimeMS(5000);
      } catch (error) {
        console.error('Error deleting for me:', error);
      }
    });

    socket.on('delete_for_everyone', async ({ messageId, receiver }) => {
      try {
        if (!isDbReady()) return;
        await Message.findByIdAndUpdate(messageId, {
          isDeletedForEveryone: true
        }).maxTimeMS(5000);
        // Notify the receiver
        socket.to(receiver).emit('message_deleted', { messageId });
      } catch (error) {
        console.error('Error deleting for everyone:', error);
      }
    });

    socket.on('edit_message', async ({ messageId, content, receiver }) => {
      try {
        if (!isDbReady()) return;
        const updatedMsg = await Message.findByIdAndUpdate(messageId, {
          content,
          isEdited: true
        }, { new: true }).maxTimeMS(5000);
        
        socket.to(receiver).emit('message_edited', updatedMsg);
      } catch (error) {
        console.error('Error editing message:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      const userId = onlineUsers.get(socket.id);
      
      if (userId) {
        // Remove from map
        onlineUsers.delete(socket.id);

        const currentCount = userConnectionCounts.get(userId) || 1;
        if (currentCount <= 1) {
          userConnectionCounts.delete(userId);
          const lastSeen = new Date();
          if (isDbReady()) {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen
            }).maxTimeMS(5000);

            socket.broadcast.emit('user_status_change', {
              userId,
              isOnline: false,
              lastSeen
            });
          }
        } else {
          userConnectionCounts.set(userId, currentCount - 1);
        }
      }
    });
  });
};

module.exports = setupSocket;
