const User = require('../models/User');

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
      settings: user.settings
    }
  });
}; 