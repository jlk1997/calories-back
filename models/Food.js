const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
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
    default: 0,
    min: [0, '碳水化合物含量不能为负']
  },
  amount: {
    type: Number,
    default: 100
  },
  unit: {
    type: String,
    default: '克'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack'
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  sourceId: {
    type: String,
    default: null
  }
});

// 创建索引以提高查询效率
FoodSchema.index({ user: 1, date: 1 });
FoodSchema.index({ name: 'text' });

module.exports = mongoose.model('Food', FoodSchema); 