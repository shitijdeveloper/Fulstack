const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
  {
    members: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming your users are stored in a 'User' model
      }],
      required: true,
      validate: {
        validator: function(v) {
          return v.length >= 2; // Ensure at least two members for a chat
        },
        message: 'A chat must have at least two members.',
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Index to prevent duplicate chats between the same members
chatSchema.index({ members: 1 }, { unique: true });

const Chat = mongoose.model('Chat', chatSchema); // Changed 'chats' to 'Chat' (singular model name)
module.exports = Chat;
