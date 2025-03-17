const errorHandler = (err, req, res, next) => {
  // 控制台记录错误
  console.error(err);

  // Mongoose错误处理
  let error = { ...err };
  error.message = err.message;

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const message = '输入的内容已存在';
    error = { message, success: false };
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, success: false };
  }

  // 默认返回500状态码
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || '服务器错误'
  });
};

module.exports = errorHandler; 