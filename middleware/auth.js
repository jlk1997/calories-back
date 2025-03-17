const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保护路由中间件
exports.protect = async (req, res, next) => {
  let token;

  // 从头部获取token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // 从Bearer token中提取token
    token = req.headers.authorization.split(' ')[1];
  }

  // 确认token存在
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '没有权限访问此路由'
    });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '找不到该用户'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: '没有权限访问此路由'
    });
  }
}; 