const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '请提供用户名'],
    unique: true,
    trim: true,
    maxlength: [50, '用户名不能超过50个字符']
  },
  email: {
    type: String,
    required: [true, '请提供邮箱'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      '请提供有效的邮箱'
    ]
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: 6,
    select: false
  },
  settings: {
    caloriesTarget: {
      type: Number,
      default: 2000
    },
    proteinTarget: {
      type: Number,
      default: 60
    },
    fatTarget: {
      type: Number,
      default: 70
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  dietaryPreferences: {
    type: [String],
    default: []
  },
  healthGoals: {
    type: [String],
    default: []
  },
  allergens: {
    type: [String],
    default: []
  },
  nutritionSettings: {
    proteinGoal: { type: Number, default: 50 },
    carbsGoal: { type: Number, default: 250 },
    fatGoal: { type: Number, default: 70 },
    preferredDietType: { 
      type: String, 
      enum: ['balanced', 'low-carb', 'high-protein', 'vegetarian', 'vegan', 'keto'],
      default: 'balanced'
    }
  },
  assistantSettings: {
    enabledFeatures: {
      dailyTips: { type: Boolean, default: true },
      mealSuggestions: { type: Boolean, default: true },
      reminderNotifications: { type: Boolean, default: true }
    },
    preferredTone: {
      type: String,
      enum: ['friendly', 'professional', 'motivational', 'humorous'],
      default: 'friendly'
    }
  }
});

// 加密密码
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 生成JWT Token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// 验证用户输入的密码是否正确
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 