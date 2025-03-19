const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [messageSchema],
    startedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now
    },
    context: {
        recentFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
        calorieStatus: String, // "under_goal", "over_goal", "near_goal"
        dietaryPreferences: [String],
        healthGoals: [String]
    }
}, { timestamps: true });

// 更新lastUpdatedAt字段
conversationSchema.pre('save', function(next) {
    if (this.isModified('messages')) {
        this.lastUpdatedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Conversation', conversationSchema); 