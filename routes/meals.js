const express = require('express');
const {
  getMealsByDate,
  addMeal,
  removeMeal,
  getMealHistory
} = require('../controllers/meals');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取和添加餐食记录
router.route('/')
  .get(getMealsByDate)
  .post(addMeal);

// 获取历史餐食记录
router.get('/history', getMealHistory);

// 删除餐食记录
router.delete('/:date/:mealId', removeMeal);

module.exports = router; 