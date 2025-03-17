const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  foodId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, '请提供食物名称'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, '请提供食物克数'],
    min: [1, '克数必须大于0']
  },
  calories: {
    type: Number,
    required: [true, '请提供卡路里数值']
  },
  protein: {
    type: Number,
    required: [true, '请提供蛋白质含量']
  },
  fat: {
    type: Number,
    required: [true, '请提供脂肪含量']
  },
  carbs: {
    type: Number,
    required: [true, '请提供碳水化合物含量']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const MealEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: [true, '请提供日期']
  },
  meals: [MealSchema],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引以根据用户ID和日期查询
MealEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealEntry', MealEntrySchema); 