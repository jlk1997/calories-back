/**
 * 智谱AI服务
 * 负责与智谱AI API通信，处理大语言模型的请求和响应
 */

const axios = require('axios');
const config = require('../config/aiConfig');

class ZhipuAIService {
  constructor() {
    // 检查API密钥是否设置
    this.apiKey = config.ZHIPU.API_KEY;
    this.modelName = config.ZHIPU.MODEL;
    this.endpoint = config.ZHIPU.ENDPOINT;
    
    // 如果apiKey为空或等于示例值，打印警告
    if (!this.apiKey || this.apiKey === 'your-zhipu-api-key') {
      console.warn('警告: 未设置有效的智谱AI API密钥，将使用模拟回复');
    } else {
      console.log('智谱AI配置加载成功，将直接使用axios调用API');
    }
  }

  /**
   * 生成AI回复
   * @param {string} userMessage - 用户消息
   * @param {Array} conversationHistory - 对话历史
   * @param {Object} contextData - 上下文数据，包含用户信息和饮食记录
   * @returns {Promise<Object>} - 返回AI回复和可能的建议
   */
  async generateResponse(userMessage, conversationHistory, contextData) {
    try {
      // 构建提示词
      const prompt = this.buildPrompt(userMessage, conversationHistory, contextData);
      
      // 检查API密钥是否有效
      if (!this.apiKey || this.apiKey === 'your-zhipu-api-key') {
        console.log('使用模拟响应，因为未配置有效的智谱AI API密钥');
        return this.getMockResponse(userMessage, contextData);
      }
      
      // 构建对话历史格式
      const formattedHistory = this.formatConversationHistory(conversationHistory);
      
      // 准备消息列表
      const messages = [
        { role: 'system', content: config.SYSTEM_PROMPT },
        ...formattedHistory,
        { role: 'user', content: prompt }
      ];
      
      try {
        // 直接使用axios调用智谱AI API
        console.log('直接调用智谱AI API，URL:', this.endpoint);
        console.log('请求参数:', {
          model: this.modelName,
          messages: messages.length + '条消息',
          temperature: config.TEMPERATURE,
          max_tokens: config.MAX_TOKENS
        });
        
        const response = await axios.post(this.endpoint, {
          model: this.modelName,
          messages: messages,
          temperature: config.TEMPERATURE,
          max_tokens: config.MAX_TOKENS
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        console.log('API响应状态:', response.status);
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const messageContent = response.data.choices[0].message.content;
          
          // 检查是否包含饮食建议
          const containsAdvice = /(建议|推荐|可以尝试|应该|营养|健康|饮食计划)/g.test(messageContent);
          
          let advice = null;
          if (containsAdvice) {
            advice = {
              type: 'response',
              content: messageContent,
              relatedFoods: []
            };
          }
          
          console.log("成功获取智谱AI回复");
          return {
            message: messageContent,
            advice
          };
        } else {
          console.error('无效的API响应结构:', JSON.stringify(response.data));
          throw new Error('无效的API响应结构');
        }
      } catch (apiError) {
        console.error('API调用错误:', apiError.message);
        if (apiError.response) {
          console.error('API错误响应数据:', apiError.response.data);
          console.error('API错误响应状态:', apiError.response.status);
        }
        // 如果API调用失败，使用模拟响应
        return this.getMockResponse(userMessage, contextData);
      }
    } catch (error) {
      console.error('智谱AI响应生成错误:', error);
      return this.getMockResponse(userMessage, contextData);
    }
  }
  
  /**
   * 构建对话历史格式
   * @param {Array} conversationHistory - 原始对话历史
   * @returns {Array} - 格式化后的对话历史
   */
  formatConversationHistory(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return [];
    }
    
    // 只保留最近的5条消息，避免token过多
    const recentMessages = conversationHistory.slice(-5);
    
    return recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }
  
  /**
   * 构建给AI的提示词
   * @param {string} userMessage - 用户消息
   * @param {Array} conversationHistory - 对话历史（已在外部格式化，这里不处理）
   * @param {Object} contextData - 上下文数据
   * @returns {string} - 构建好的提示词
   */
  buildPrompt(userMessage, conversationHistory, contextData) {
    const { user, todaysFoods, currentCalories, targetCalories } = contextData;
    
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
    
    return `
${userContext}

${foodContext}

用户问题: ${userMessage}

请提供一个有帮助的、针对性的响应，专注于饮食健康。
    `;
  }
  
  /**
   * 生成每日饮食建议
   * @param {string} userId - 用户ID
   * @param {Object} userProfile - 用户档案
   * @param {Array} foodLogs - 用户饮食记录
   * @returns {Promise<Object>} - 返回生成的建议
   */
  async generateDailyAdvice(userId, userProfile, foodLogs) {
    try {
      if (!this.apiKey || this.apiKey === 'your-zhipu-api-key') {
        return this.getDefaultDailyAdvice();
      }
      
      // 构建提示
      const prompt = `
分析以下用户的饮食情况并提供今日建议：

用户信息:
- 性别: ${userProfile.gender || '未知'}
- 年龄: ${userProfile.age || '未知'}
- 身高: ${userProfile.height || '未知'} cm
- 体重: ${userProfile.weight || '未知'} kg
- 目标卡路里: ${userProfile.dailyCalorieGoal || 2000} 卡路里/天
- 饮食偏好: ${userProfile.dietaryPreferences?.join(', ') || '无特殊偏好'}
- 健康目标: ${userProfile.healthGoals?.join(', ') || '保持健康'}

最近饮食记录:
${foodLogs.map(log => `- ${new Date(log.date).toLocaleDateString()}: ${log.name}, ${log.calories}卡路里`).join('\n')}

请提供：
1. 简短的饮食建议
2. 具体的今日饮食计划建议
3. 需要注意的饮食事项
      `;
      
      try {
        // 直接使用axios调用智谱AI API
        const response = await axios.post(this.endpoint, {
          model: this.modelName,
          messages: [
            { role: 'system', content: config.SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: config.TEMPERATURE,
          max_tokens: config.MAX_TOKENS
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const messageContent = response.data.choices[0].message.content;
          
          return {
            message: messageContent,
            advice: {
              type: 'daily',
              content: messageContent,
              relatedFoods: []
            }
          };
        } else {
          throw new Error('无效的API响应结构');
        }
      } catch (apiError) {
        console.error('API调用错误:', apiError.message);
        if (apiError.response) {
          console.error('API错误响应数据:', apiError.response.data);
        }
        // 如果API调用失败，使用默认建议
        return this.getDefaultDailyAdvice();
      }
    } catch (error) {
      console.error('生成每日建议错误:', error);
      
      // 返回默认建议
      return this.getDefaultDailyAdvice();
    }
  }
  
  /**
   * 获取默认的每日建议
   * @returns {Object} - 默认建议
   */
  getDefaultDailyAdvice() {
    return {
      message: "今天尝试增加更多蔬菜摄入，确保蛋白质足够，适当控制精制碳水化合物。多喝水，少吃油炸食品。",
      advice: {
        type: 'daily',
        content: "今天尝试增加更多蔬菜摄入，确保蛋白质足够，适当控制精制碳水化合物。多喝水，少吃油炸食品。",
        relatedFoods: []
      }
    };
  }
  
  /**
   * 提供模拟响应
   * @param {string} userMessage - 用户消息
   * @param {Object} contextData - 上下文数据
   * @returns {Object} - 模拟的AI响应
   */
  getMockResponse(userMessage, contextData) {
    console.log('生成模拟响应');
    
    // 简单关键词匹配
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // 饮食建议回复
    if (lowerCaseMessage.includes('吃什么') || lowerCaseMessage.includes('建议')) {
      return {
        message: "建议您多摄入蔬菜水果，适量增加优质蛋白质的摄入，如鸡胸肉、鱼类和豆制品。减少精制碳水化合物和油炸食品的摄入量。每日饮水量保持在1.5-2升左右。餐前可以喝一杯温水，有助于增加饱腹感，控制食量。",
        advice: {
          type: 'response',
          content: "建议您多摄入蔬菜水果，适量增加优质蛋白质的摄入，如鸡胸肉、鱼类和豆制品。减少精制碳水化合物和油炸食品的摄入量。每日饮水量保持在1.5-2升左右。餐前可以喝一杯温水，有助于增加饱腹感，控制食量。",
          relatedFoods: []
        }
      };
    }
    
    // 询问卡路里相关
    if (lowerCaseMessage.includes('卡路里') || lowerCaseMessage.includes('热量')) {
      return {
        message: "控制卡路里摄入是健康饮食的重要部分。每个人需要的卡路里量根据年龄、性别、体重和活动水平而不同。一般成年人每日需要约2000-2500卡路里。建议记录每日摄入的食物，以便更好地跟踪卡路里摄入量。减肥期间可以适当控制在基础代谢率以下300-500卡路里。",
        advice: null
      };
    }
    
    // 减肥相关问题
    if (lowerCaseMessage.includes('减肥') || lowerCaseMessage.includes('瘦')) {
      return {
        message: "健康减肥需要平衡的饮食和适当的运动。建议增加蛋白质摄入，控制碳水化合物，多吃纤维素丰富的食物如蔬菜和全谷物。每周进行至少150分钟的中等强度有氧运动，配合力量训练。中国传统的食疗理念也很有帮助，如食用山药、薏米等食材。切忌极端节食，那会损害健康并导致反弹。",
        advice: {
          type: 'response',
          content: "健康减肥需要平衡的饮食和适当的运动。建议增加蛋白质摄入，控制碳水化合物，多吃纤维素丰富的食物如蔬菜和全谷物。每周进行至少150分钟的中等强度有氧运动，配合力量训练。中国传统的食疗理念也很有帮助，如食用山药、薏米等食材。切忌极端节食，那会损害健康并导致反弹。",
          relatedFoods: []
        }
      };
    }
    
    // 问候回复
    if (lowerCaseMessage.includes('你好') || lowerCaseMessage.includes('嗨') || lowerCaseMessage.includes('hi')) {
      return {
        message: "你好！我是你的健康饮食助手。我可以提供饮食建议、分析营养需求，并帮助你制定健康的饮食计划。有什么我可以帮到你的吗？比如你可以询问今天吃什么、如何健康减肥、或者特定食物的营养价值。",
        advice: null
      };
    }
    
    // 默认回复
    return {
      message: "感谢您的咨询。作为您的营养顾问，我建议您保持均衡饮食，确保每餐都包含蛋白质、复合碳水化合物和健康脂肪。您有具体的饮食问题想要了解吗？我可以为您提供更有针对性的建议。",
      advice: null
    };
  }
}

module.exports = new ZhipuAIService(); 