const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settings');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

module.exports = router; 