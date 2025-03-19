const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class AIService {
    // 生成助手响应
    static async generateResponse(userMessage, conversationHistory, contextData) {
        try {
            // 使用LLM构建提示
            const prompt = this.buildPrompt(userMessage, conversationHistory, contextData);
            
            // 检查API密钥是否为示例值或未设置
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey || apiKey === 'sk-your-openai-api-key' || apiKey === 'your-api-key') {
                console.log('使用模拟响应，因为未配置有效的OpenAI API密钥');
                return this.getMockResponse(userMessage, contextData);
            }
            
            // 调用外部LLM API
            const response = await this.callLLMAPI(prompt);
            
            // 解析响应
            const parsedResponse = this.parseResponse(response);
            
            return parsedResponse;
        } catch (error) {
            console.error('AI响应生成错误:', error);
            return this.getMockResponse(userMessage, contextData);
        }
    }
    
    // 构建LLM提示
    static buildPrompt(userMessage, conversationHistory, contextData) {
        const { user, recentFoods, todaysFoods, currentCalories, targetCalories } = contextData;
        
        // 构建用户上下文
        let userContext = `用户信息:\n`;
        userContext += `- 目标卡路里: ${targetCalories || 2000} 卡路里/天\n`;
        userContext += `- 当前卡路里摄入: ${currentCalories || 0} 卡路里\n`;
        
        if (user && user.dietaryPreferences && user.dietaryPreferences.length > 0) {
            userContext += `- 饮食偏好: ${user.dietaryPreferences.join(', ')}\n`;
        } else {
            userContext += `- 饮食偏好: 无特殊偏好\n`;
        }
        
        if (user && user.healthGoals && user.healthGoals.length > 0) {
            userContext += `- 健康目标: ${user.healthGoals.join(', ')}\n`;
        } else {
            userContext += `- 健康目标: 保持健康\n`;
        }
        
        if (user && user.allergens && user.allergens.length > 0) {
            userContext += `- 食物过敏: ${user.allergens.join(', ')}\n`;
        } else {
            userContext += `- 食物过敏: 无\n`;
        }
        
        // 构建今日食物列表
        let foodContext = `今日食物:\n`;
        if (todaysFoods && todaysFoods.length > 0) {
            todaysFoods.forEach(food => {
                foodContext += `- ${food.name}: ${food.calories} 卡路里 (${new Date(food.date).toLocaleTimeString()})\n`;
            });
        } else {
            foodContext += "- 今天还没有记录食物\n";
        }
        
        // 构建对话历史
        let conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = `最近的对话:\n`;
            // 只取最近5条消息
            const recentMessages = conversationHistory.slice(-5);
            recentMessages.forEach(msg => {
                const role = msg.sender === 'user' ? '用户' : '助手';
                conversationContext += `${role}: ${msg.content}\n`;
            });
        }
        
        // 构建系统提示
        const systemPrompt = `
            你是一个专业的营养师和饮食顾问。你的主要职责是帮助用户改善饮食习惯，提供有价值的营养建议，并支持他们实现健康目标。
            
            请根据用户的饮食记录和偏好给出针对性的建议。保持友好、支持性的语气，避免严厉批评。
            专注于积极的改变和实用的建议。所有回复都应围绕饮食、营养和健康生活方式。
            
            如果用户询问与饮食无关的话题，礼貌地将对话引导回健康饮食相关的内容。
            
            ${userContext}
            
            ${foodContext}
            
            ${conversationContext}
            
            用户最新消息: ${userMessage}
            
            请提供一个有帮助的、针对性的响应，专注于饮食健康。
        `;
        
        return systemPrompt;
    }
    
    // 调用外部LLM API
    static async callLLMAPI(prompt) {
        // 实际项目中应该使用环境变量存储API密钥和端点
        try {
            // 这里演示使用OpenAI API，实际实现可能会有所不同
            const API_KEY = process.env.OPENAI_API_KEY || 'your-api-key';
            const API_ENDPOINT = process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
            
            const response = await axios.post(API_ENDPOINT, {
                model: "gpt-3.5-turbo", // 或其他适合的模型
                messages: [
                    { role: "system", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('LLM API调用错误:', error);
            
            // 失败时返回模拟响应
            return {
                choices: [
                    {
                        message: {
                            content: "我理解您对饮食健康的关注。基于您提供的信息，建议保持均衡饮食并关注蛋白质摄入。您有更具体的饮食问题吗？"
                        }
                    }
                ]
            };
        }
    }
    
    // 解析LLM响应
    static parseResponse(response) {
        let messageContent = "抱歉，我现在无法提供建议。请稍后再试。";
        
        try {
            if (response && response.choices && response.choices.length > 0) {
                messageContent = response.choices[0].message.content;
            }
            
            // 尝试检测是否包含饮食建议
            const containsAdvice = /(建议|推荐|可以尝试|应该|营养|健康|饮食计划)/g.test(messageContent);
            
            let advice = null;
            if (containsAdvice) {
                advice = {
                    type: 'response',
                    content: messageContent,
                    relatedFoods: []
                };
            }
            
            return {
                message: messageContent,
                advice
            };
        } catch (error) {
            console.error('解析响应错误:', error);
            return {
                message: messageContent,
                advice: null
            };
        }
    }
    
    // 生成每日饮食建议
    static async generateDailyAdvice(userId) {
        // 此功能可以在后续实现
        // 例如，基于用户的历史记录和目标生成每日建议
        return {
            message: "今天尝试增加更多蔬菜摄入，并确保摄入足够的蛋白质。",
            advice: {
                type: 'daily',
                content: "今天尝试增加更多蔬菜摄入，并确保摄入足够的蛋白质。建议午餐加入沙拉，晚餐选择瘦肉蛋白。",
                relatedFoods: []
            }
        };
    }
    
    // 模拟响应，当API密钥未配置时使用
    static getMockResponse(userMessage, contextData) {
        console.log('生成模拟响应');
        
        // 简单关键词匹配
        const lowerCaseMessage = userMessage.toLowerCase();
        
        // 饮食建议回复
        if (lowerCaseMessage.includes('吃什么') || lowerCaseMessage.includes('建议')) {
            return {
                message: "建议您多摄入蔬菜水果，适量增加优质蛋白质的摄入，如鸡胸肉、鱼类和豆制品。减少精制碳水化合物和油炸食品的摄入量。每日饮水量保持在1.5-2升左右。",
                advice: {
                    type: 'response',
                    content: "建议您多摄入蔬菜水果，适量增加优质蛋白质的摄入，如鸡胸肉、鱼类和豆制品。减少精制碳水化合物和油炸食品的摄入量。每日饮水量保持在1.5-2升左右。",
                    relatedFoods: []
                }
            };
        }
        
        // 询问卡路里相关
        if (lowerCaseMessage.includes('卡路里') || lowerCaseMessage.includes('热量')) {
            return {
                message: "控制卡路里摄入是健康饮食的重要部分。每个人需要的卡路里量根据年龄、性别、体重和活动水平而不同。一般成年人每日需要约2000-2500卡路里。建议记录每日摄入的食物，以便更好地跟踪卡路里摄入量。",
                advice: null
            };
        }
        
        // 减肥相关问题
        if (lowerCaseMessage.includes('减肥') || lowerCaseMessage.includes('瘦')) {
            return {
                message: "健康减肥需要平衡的饮食和适当的运动。建议增加蛋白质摄入，控制碳水化合物，多吃纤维素丰富的食物如蔬菜和全谷物。每周进行至少150分钟的中等强度有氧运动，配合力量训练。切忌极端节食，那会损害健康并导致反弹。",
                advice: {
                    type: 'response',
                    content: "健康减肥需要平衡的饮食和适当的运动。建议增加蛋白质摄入，控制碳水化合物，多吃纤维素丰富的食物如蔬菜和全谷物。每周进行至少150分钟的中等强度有氧运动，配合力量训练。切忌极端节食，那会损害健康并导致反弹。",
                    relatedFoods: []
                }
            };
        }
        
        // 问候回复
        if (lowerCaseMessage.includes('你好') || lowerCaseMessage.includes('嗨') || lowerCaseMessage.includes('hi')) {
            return {
                message: "你好！我是你的健康饮食助手。我可以提供饮食建议、分析营养需求，并帮助你制定健康的饮食计划。有什么我可以帮到你的吗？",
                advice: null
            };
        }
        
        // 默认回复
        return {
            message: "感谢您的咨询。作为您的营养顾问，我建议您保持均衡饮食，确保每餐都包含蛋白质、复合碳水化合物和健康脂肪。您有具体的饮食问题想要了解吗？",
            advice: null
        };
    }
}

module.exports = AIService; 