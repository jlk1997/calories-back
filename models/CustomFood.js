const mongoose = require('mongoose');

const CustomFoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供食物名称'],
    trim: true,
    maxlength: [100, '食物名称不能超过100个字符']
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
  isPublic: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// 创建索引以提高搜索效率
CustomFoodSchema.index({ name: 'text' });
CustomFoodSchema.index({ userId: 1 });
CustomFoodSchema.index({ isPublic: 1 });

module.exports = mongoose.model('CustomFood', CustomFoodSchema); 