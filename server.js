/**
 * 卡路里追踪器 API 服务器
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const errorHandler = require('./middleware/error');
const ZhipuAIService = require('./services/ZhipuAIService');

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
const conversationRoutes = require('./routes/conversation');

// 创建应用
const app = express();

// 中间件
app.use(express.json({ limit: '50mb' })); // 增加限制以支持较大的图片上传
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 设置静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 自定义CORS中间件，灵活处理不同环境
app.use((req, res, next) => {
  // 获取请求的origin
  const origin = req.headers.origin;
  
  // 判断是开发环境还是生产环境
  const isDev = process.env.NODE_ENV === 'development';
  
  // 开发环境允许localhost的多个端口，生产环境则允许实际域名
  if (isDev || 
      origin?.includes('localhost') || 
      origin?.includes('127.0.0.1') || 
      !origin) {
    // 在开发环境中，设置允许请求的origin
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  } else {
    // 在生产环境中，采用更严格的CORS规则，或者使用先前配置的规则
    res.header('Access-Control-Allow-Origin', '*'); // 根据实际情况可能需要指定具体域名
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  }
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 挂载路由
app.use('/api/auth', auth);
app.use('/api/users/settings', settings);
app.use('/api/foods', foods);
app.use('/api/meals', meals);
app.use('/api/conversation', conversationRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// 添加API版本的健康检查
app.get('/api/healthcheck', (req, res) => {
    res.status(200).json({
        status: 'ok',
        server: 'calorie-tracker-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 测试智谱AI连接
if (ZhipuAIService.apiKey && ZhipuAIService.apiKey !== 'your-zhipu-api-key') {
    console.log('智谱AI配置已加载，模型:', ZhipuAIService.modelName);
} else {
    console.warn('警告: 未配置智谱AI API密钥，将使用模拟响应');
}

// 错误处理中间件
app.use(errorHandler);

// 获取端口设置
const PORT = process.env.PORT || 5000;

// 启动服务器
const server = app.listen(PORT, async () => {
  await connectDB();
  console.log(`服务器在${process.env.NODE_ENV}模式下运行，端口为${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    // 不要立即退出，记录错误并继续运行
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    // 不要立即退出，记录错误并继续运行
}); 