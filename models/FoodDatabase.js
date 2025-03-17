const mongoose = require('mongoose');

const FoodDatabaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供食物名称'],
    trim: true,
    unique: true
  },
  calories: {
    type: Number,
    required: [true, '请提供卡路里数值'],
    min: [0, '卡路里数值不能为负']
  },
  protein: {
    type: Number,
    required: [true, '请提供蛋白质含量'],
    min: [0, '蛋白质含量不能为负']
  },
  fat: {
    type: Number,
    required: [true, '请提供脂肪含量'],
    min: [0, '脂肪含量不能为负']
  },
  carbs: {
    type: Number,
    required: [true, '请提供碳水化合物含量'],
    min: [0, '碳水化合物含量不能为负']
  },
  perUnit: {
    type: String,
    default: '100克'
  },
  source: {
    type: String,
    enum: ['system', 'user'],
    default: 'system'
  },
  popularity: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建文本索引以提高搜索效率
FoodDatabaseSchema.index({ name: 'text' });

module.exports = mongoose.model('FoodDatabase', FoodDatabaseSchema); 