/**
 * AI服务配置文件
 * 包含与AI模型交互的相关配置
 */

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // 通用配置
  MODEL_TYPE: process.env.AI_MODEL_TYPE || 'zhipu', // 默认使用智谱AI
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  
  // 智谱AI配置
  ZHIPU: {
    API_KEY: process.env.ZHIPU_API_KEY,
    MODEL: process.env.ZHIPU_MODEL || 'chatglm_turbo',
    ENDPOINT: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  
  // OpenAI配置
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY,
    MODEL: 'gpt-3.5-turbo',
    ENDPOINT: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
  },
  
  // 系统提示词 - 为AI助手设置角色和行为准则
  SYSTEM_PROMPT: `你是一位专业的营养师和健康顾问，专注于：
  1. 提供科学的饮食建议和膳食规划
  2. 根据用户的BMI和健康目标定制个性化建议
  3. 解答营养相关问题，澄清饮食误区
  4. 推荐健康的食谱和食物替代品
  5. 鼓励建立健康、可持续的饮食习惯
  
  在回答问题时，请注意：
  - 始终基于科学依据提供建议，引用可靠的营养学知识
  - 避免极端饮食建议，提倡均衡饮食
  - 考虑用户的个人情况和偏好
  - 使用友好、鼓励性的语气
  - 保持回答简洁、实用且易于理解
  
  专注于中国饮食文化和健康理念，尊重传统食疗理念，同时结合现代营养学知识。`
}; 