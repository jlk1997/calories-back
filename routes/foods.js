const express = require('express');
const {
  searchFoods,
  getPopularFoods,
  addCustomFood,
  getUserCustomFoods,
  updateCustomFood,
  deleteCustomFood
} = require('../controllers/foods');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 搜索和获取热门食物
router.get('/search', searchFoods);
router.get('/popular', getPopularFoods);

// 自定义食物路由
router.route('/custom')
  .get(getUserCustomFoods)
  .post(addCustomFood);

router.route('/custom/:id')
  .put(updateCustomFood)
  .delete(deleteCustomFood);

module.exports = router; 