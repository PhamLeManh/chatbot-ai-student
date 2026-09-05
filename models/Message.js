const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        fileType: { type: String },
        size: { type: Number },
      },
    ],
    feedback: {
      type: String,
      enum: ['like', 'dislike', 'none'],
      default: 'none',
    },
    meta: {
      model: { type: String, default: 'gpt-4o-mini' },
      tokens: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
