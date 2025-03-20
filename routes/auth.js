const express = require('express');
const { register, login, getMe, logout, updateUser, uploadAvatar } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 保护路由
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update', protect, updateUser);
router.post('/avatar', protect, uploadAvatar);

module.exports = router; 