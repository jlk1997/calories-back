const Conversation = require('../models/Conversation');
const DietaryAdvice = require('../models/DietaryAdvice');
const User = require('../models/User');
const Food = require('../models/Food');
const AIService = require('./AIService');
const ZhipuAIService = require('./ZhipuAIService');
const config = require('../config/aiConfig');

class ConversationService {
    // 创建新对话或获取当前对话
    static async getOrCreateConversation(userId) {
        try {
            // 查找用户最近的对话，如果24小时内有，则复用
            let conversation = await Conversation.findOne({
                user: userId,
                lastUpdatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }).sort({ lastUpdatedAt: -1 });
            
            // 如果没有，创建新对话
            if (!conversation) {
                // 获取用户近期饮食记录，作为对话上下文
                const recentFoods = await this.getRecentFoods(userId, 3);
                const calorieStatus = await this.getCurrentCalorieStatus(userId);
                
                conversation = new Conversation({
                    user: userId,
                    messages: [],
                    context: {
                        recentFoods: recentFoods.map(food => food._id),
                        calorieStatus
                    }
                });
                await conversation.save();
            }
            
            return conversation;
        } catch (error) {
            throw new Error(`获取对话失败: ${error.message}`);
        }
    }
    
    // 获取用户最近的食物记录
    static async getRecentFoods(userId, limit = 3) {
        try {
            return await Food.find({ user: userId })
                .sort({ date: -1 })
                .limit(limit);
        } catch (error) {
            console.error('获取最近食物失败:', error);
            return [];
        }
    }
    
    // 获取用户当前卡路里状态
    static async getCurrentCalorieStatus(userId) {
        try {
            const user = await User.findById(userId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todaysFoods = await Food.find({
                user: userId,
                date: { $gte: today }
            });
            
            const consumedCalories = todaysFoods.reduce((sum, food) => sum + food.calories, 0);
            const targetCalories = user.dailyCalorieGoal;
            
            if (consumedCalories < targetCalories * 0.8) {
                return 'under_goal';
            } else if (consumedCalories > targetCalories * 1.1) {
                return 'over_goal';
            } else {
                return 'near_goal';
            }
        } catch (error) {
            console.error('获取卡路里状态失败:', error);
            return 'unknown';
        }
    }
    
    // 添加用户消息并获取助手回复
    static async processUserMessage(userId, userMessage) {
        try {
            // 获取或创建对话
            const conversation = await this.getOrCreateConversation(userId);
            
            // 添加用户消息
            conversation.messages.push({
                sender: 'user',
                content: userMessage
            });
            
            // 获取上下文信息
            const contextData = await this.buildConversationContext(userId, conversation);
            
            // 根据配置选择使用的AI服务
            let aiResponse;
            if (config.MODEL_TYPE === 'zhipu') {
                // 使用智谱AI
                console.log('使用智谱AI生成响应');
                aiResponse = await ZhipuAIService.generateResponse(
                    userMessage, 
                    conversation.messages, 
                    contextData
                );
            } else {
                // 使用原有AI服务
                console.log('使用默认AI服务生成响应');
                aiResponse = await AIService.generateResponse(
                    userMessage, 
                    conversation.messages, 
                    contextData
                );
            }
            
            // 添加助手消息
            conversation.messages.push({
                sender: 'assistant',
                content: aiResponse.message
            });
            
            // 保存对话
            conversation.lastUpdatedAt = new Date();
            await conversation.save();
            
            // 如果AI生成了特定建议，保存它
            if (aiResponse.advice) {
                await this.saveAdvice(userId, aiResponse.advice, conversation._id);
            }
            
            return {
                message: aiResponse.message,
                conversationId: conversation._id
            };
        } catch (error) {
            console.error('处理消息失败:', error);
            return {
                message: "抱歉，我现在无法处理您的请求。请稍后再试。",
                conversationId: null
            };
        }
    }
    
    // 构建对话上下文
    static async buildConversationContext(userId, conversation) {
        try {
            const user = await User.findById(userId)
                .select('username dailyCalorieGoal dietaryPreferences healthGoals allergens nutritionSettings');
            
            const recentFoods = await Food.find({
                _id: { $in: conversation.context.recentFoods }
            });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todaysFoods = await Food.find({
                user: userId,
                date: { $gte: today }
            });
            
            return {
                user,
                recentFoods,
                todaysFoods,
                currentCalories: todaysFoods.reduce((sum, food) => sum + food.calories, 0),
                targetCalories: user.dailyCalorieGoal
            };
        } catch (error) {
            console.error('构建对话上下文失败:', error);
            return {
                user: {},
                recentFoods: [],
                todaysFoods: [],
                currentCalories: 0,
                targetCalories: 2000
            };
        }
    }
    
    // 保存饮食建议
    static async saveAdvice(userId, advice, conversationId) {
        try {
            const dietaryAdvice = new DietaryAdvice({
                user: userId,
                type: advice.type,
                content: advice.content,
                relatedFoods: advice.relatedFoods || [],
                conversationId
            });
            
            await dietaryAdvice.save();
            return dietaryAdvice;
        } catch (error) {
            console.error('保存饮食建议失败:', error);
            return null;
        }
    }
    
    // 获取用户的对话历史
    static async getUserConversationHistory(userId, limit = 5) {
        try {
            return await Conversation.find({ user: userId })
                .sort({ lastUpdatedAt: -1 })
                .limit(limit);
        } catch (error) {
            console.error('获取对话历史失败:', error);
            return [];
        }
    }
    
    // 获取特定对话
    static async getConversation(conversationId, userId) {
        try {
            return await Conversation.findOne({
                _id: conversationId,
                user: userId
            });
        } catch (error) {
            console.error('获取对话失败:', error);
            return null;
        }
    }
    
    // 获取用户的所有建议
    static async getUserAdvice(userId, type = null) {
        try {
            let query = { user: userId };
            if (type) {
                query.type = type;
            }
            
            return await DietaryAdvice.find(query)
                .sort({ generatedAt: -1 })
                .populate('relatedFoods');
        } catch (error) {
            console.error('获取用户建议失败:', error);
            return [];
        }
    }
}

module.exports = ConversationService; 