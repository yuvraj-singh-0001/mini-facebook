const { Server } = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust in production
      methods: ['GET', 'POST']
    }
  });

  const onlineUsers = new Map(); // socket.id -> userId

  io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // When user logs in or connects, they join their own room using their userId
    socket.on('setup', async (userId) => {
      socket.join(userId);
      onlineUsers.set(socket.id, userId);

      // Update user status
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.broadcast.emit('user_status_change', { userId, isOnline: true });
      
      console.log(`User ${userId} joined room ${userId}`);
    });

    // Send Message
    socket.on('send_message', async (data, callback) => {
      try {
        const { sender, receiver, content, type, imageUrl } = data;
        
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
          await savedMessage.save();
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
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: 'seen' } }
        );
        socket.to(receiver).emit('messages_seen_update', { messageIds, receiver: sender });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    socket.on('delete_for_me', async ({ messageId, userId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { isDeletedForMe: userId }
        });
      } catch (error) {
        console.error('Error deleting for me:', error);
      }
    });

    socket.on('delete_for_everyone', async ({ messageId, receiver }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          isDeletedForEveryone: true
        });
        // Notify the receiver
        socket.to(receiver).emit('message_deleted', { messageId });
      } catch (error) {
        console.error('Error deleting for everyone:', error);
      }
    });

    socket.on('edit_message', async ({ messageId, content, receiver }) => {
      try {
        const updatedMsg = await Message.findByIdAndUpdate(messageId, {
          content,
          isEdited: true
        }, { new: true });
        
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
        
        // Update user status
        await User.findByIdAndUpdate(userId, { 
          isOnline: false,
          lastSeen: new Date()
        });
        
        socket.broadcast.emit('user_status_change', { 
          userId, 
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });
  });
};

module.exports = setupSocket;
