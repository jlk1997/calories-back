/**
 * 对话路由
 * 处理与AI助手对话相关的API路由
 */

const express = require('express');
const { 
    sendMessage, 
    getConversationHistory, 
    getConversationsList,
    getDietaryAdvice,
    markAdviceAsRead
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 应用认证中间件
router.use(protect);

// 发送消息给AI助手
router.post('/message', sendMessage);

// 获取指定对话历史
router.get('/history/:conversationId?', getConversationHistory);

// 获取对话列表
router.get('/list', getConversationsList);

// 获取饮食建议
router.get('/advice', getDietaryAdvice);

// 标记建议为已读
router.put('/advice/:adviceId/read', markAdviceAsRead);

module.exports = router; 