const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/error');

// 加载环境变量
dotenv.config({ path: './config/config.env' });

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB 已连接: ${conn.connection.host}`);
  } catch (err) {
    console.error(`数据库连接错误: ${err.message}`);
    process.exit(1);
  }
};

// 引入路由文件
const auth = require('./routes/auth');
const settings = require('./routes/settings');
const foods = require('./routes/foods');
const meals = require('./routes/meals');

// 创建应用
const app = express();

// 中间件
app.use(express.json());
app.use(cors());

// 挂载路由
app.use('/api/auth', auth);
app.use('/api/users/settings', settings);
app.use('/api/foods', foods);
app.use('/api/meals', meals);

// 错误处理中间件
app.use(errorHandler);

// 获取端口设置
const PORT = process.env.PORT || 5000;

// 启动服务器
const server = app.listen(PORT, async () => {
  await connectDB();
  console.log(`服务器在${process.env.NODE_ENV}模式下运行，端口为${PORT}`);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (err, promise) => {
  console.log(`错误: ${err.message}`);
  // 关闭服务器并退出进程
  server.close(() => process.exit(1));
}); 