const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Đoạn hội thoại mới',
    },
    subject: {
      type: String,
      trim: true,
      default: 'Tổng hợp',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
