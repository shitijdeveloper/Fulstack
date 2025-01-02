const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const Chat = require('./Chat');
const Message = require('./Message');

const app = express();
app.use(express.json());
app.use(cors());

const port = 8801; // Backend port
const mongoURI = 'mongodb://localhost:27017/CRM'; // Update with your MongoDB URI

// Connect to MongoDB with better error handling
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if connection fails
  });

// Routes
// Create new chat if it doesn't exist
app.post('/', async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    // Ensure senderId and receiverId are sorted to prevent duplicates (order doesn't matter)
    const chatExists = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
    });
    
    if (chatExists) {
      return res.status(400).json({ message: 'Chat already exists' });
    }

    const newChat = new Chat({
      members: [senderId, receiverId],
    });
    const result = await newChat.save();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chats for a specific user
app.get('/:userId', async (req, res) => {
  try {
    const chat = await Chat.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new message to a chat
app.post('/addmessage', async (req, res) => {
  const { chatId, senderId, text } = req.body;
  const message = new Message({ chatId, senderId, text });
  try {
    const result = await message.save();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages in a specific chat with pagination
app.get('/:chatId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query; // Add pagination with query parameters
    const messages = await Message.find({ chatId: req.params.chatId })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Socket.io setup
const io = new Server(8800, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

let activeUsers = [];

io.on('connection', (socket) => {
  socket.on('new-user-add', (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log('New User Connected:', activeUsers);
    }
    io.emit('get-users', activeUsers);
  });

  socket.on('disconnect', () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log('User Disconnected:', activeUsers);
    io.emit('get-users', activeUsers);
  });

  socket.on('send-message', (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    if (user) {
      io.to(user.socketId).emit('recieve-message', data);
    }
  });
});
