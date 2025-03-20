const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// @desc    注册用户
// @route   POST /api/auth/register
// @access  公开
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '该用户名已被使用'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  公开
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证是否提供了邮箱和密码
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱和密码'
      });
    }

    // 查找用户并包含密码
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '无效的凭据'
      });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '无效的凭据'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    获取当前登录用户
// @route   GET /api/auth/me
// @access  私有
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    更新用户信息
// @route   PUT /api/auth/update
// @access  私有
exports.updateUser = async (req, res, next) => {
  try {
    // 可更新的字段
    const allowedUpdates = [
      'gender', 'age', 'height', 'weight', 'bodyFat', 
      'healthStatus', 'fitnessGoal', 'onboardingCompleted'
    ];
    
    // 过滤出允许更新的字段
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // 更新用户
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    上传用户头像
// @route   POST /api/auth/avatar
// @access  私有
exports.uploadAvatar = async (req, res, next) => {
  try {
    // 检查是否有文件数据
    if (!req.body.imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供图片数据'
      });
    }
    
    // 从base64数据中提取图片数据和类型
    const imageDataParts = req.body.imageData.split(';base64,');
    if (imageDataParts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: '无效的图片数据格式'
      });
    }
    
    const mimeType = imageDataParts[0].split(':')[1];
    const extension = mimeType.split('/')[1];
    const imageBuffer = Buffer.from(imageDataParts[1], 'base64');
    
    // 允许的图片类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: '只允许上传 JPG, PNG, GIF 格式的图片'
      });
    }
    
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../public/uploads/avatars');
    try {
      await promisify(fs.mkdir)(uploadDir, { recursive: true });
    } catch (error) {
      console.error('创建目录失败:', error);
    }
    
    // 生成唯一文件名
    const fileName = `${req.user.id}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // 写入文件
    await promisify(fs.writeFile)(filePath, imageBuffer);
    
    // 更新用户头像URL
    const avatarUrl = `/uploads/avatars/${fileName}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        avatar: avatarUrl,
        user
      }
    });
  } catch (err) {
    console.error('上传头像错误:', err);
    next(err);
  }
};

// @desc    用户登出
// @route   POST /api/auth/logout
// @access  私有
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: '用户已成功登出'
  });
};

// 生成token并发送响应
const sendTokenResponse = (user, statusCode, res) => {
  // 创建token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      settings: user.settings,
      avatar: user.avatar,
      gender: user.gender,
      onboardingCompleted: user.onboardingCompleted
    }
  });
}; 