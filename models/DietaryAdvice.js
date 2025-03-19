const mongoose = require('mongoose');

const dietaryAdviceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'response', 'suggestion'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    relatedFoods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    }],
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('DietaryAdvice', dietaryAdviceSchema); 