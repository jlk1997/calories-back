const ConversationService = require('../services/ConversationService');
const Conversation = require('../models/Conversation');
const DietaryAdvice = require('../models/DietaryAdvice');

// 处理用户消息
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: '消息内容不能为空'
            });
        }
        
        const response = await ConversationService.processUserMessage(userId, message);
        
        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('发送消息错误:', error);
        res.status(500).json({
            success: false,
            message: '处理消息时发生错误'
        });
    }
}

// 获取对话历史
exports.getConversationHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        
        let conversation;
        if (conversationId) {
            // 获取特定对话
            conversation = await Conversation.findOne({
                _id: conversationId,
                user: userId
            });
            
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: '对话不存在'
                });
            }
        } else {
            // 获取最近的对话
            conversation = await ConversationService.getOrCreateConversation(userId);
        }
        
        res.json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error('获取对话历史错误:', error);
        res.status(500).json({
            success: false,
            message: '获取对话历史时发生错误'
        });
    }
}

// 获取所有对话列表
exports.getConversationsList = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, page = 1 } = req.query;
        
        const conversations = await Conversation.find({ user: userId })
            .sort({ lastUpdatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('_id startedAt lastUpdatedAt messages');
        
        // 为每个对话添加简短预览
        const conversationsWithPreview = conversations.map(conv => {
            const userMessages = conv.messages.filter(msg => msg.sender === 'user');
            const firstUserMessage = userMessages.length > 0 ? userMessages[0].content : '';
            const preview = firstUserMessage.length > 50 
                ? firstUserMessage.substring(0, 50) + '...' 
                : firstUserMessage;
            
            return {
                _id: conv._id,
                startedAt: conv.startedAt,
                lastUpdatedAt: conv.lastUpdatedAt,
                preview,
                messageCount: conv.messages.length
            };
        });
        
        res.json({
            success: true,
            data: conversationsWithPreview
        });
    } catch (error) {
        console.error('获取对话列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取对话列表时发生错误'
        });
    }
}

// 获取饮食建议
exports.getDietaryAdvice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query;
        
        const advice = await ConversationService.getUserAdvice(userId, type);
        
        res.json({
            success: true,
            data: advice
        });
    } catch (error) {
        console.error('获取饮食建议错误:', error);
        res.status(500).json({
            success: false,
            message: '获取饮食建议时发生错误'
        });
    }
}

// 将建议标记为已读
exports.markAdviceAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { adviceId } = req.params;
        
        const advice = await DietaryAdvice.findOneAndUpdate(
            { _id: adviceId, user: userId },
            { isRead: true },
            { new: true }
        );
        
        if (!advice) {
            return res.status(404).json({
                success: false,
                message: '建议不存在'
            });
        }
        
        res.json({
            success: true,
            data: advice
        });
    } catch (error) {
        console.error('标记建议错误:', error);
        res.status(500).json({
            success: false,
            message: '标记建议时发生错误'
        });
    }
}