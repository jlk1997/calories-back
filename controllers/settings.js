const User = require('../models/User');

// @desc    获取用户设置
// @route   GET /api/users/settings
// @access  私有
exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: user.settings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    更新用户设置
// @route   PUT /api/users/settings
// @access  私有
exports.updateSettings = async (req, res, next) => {
  try {
    const { caloriesTarget, proteinTarget, fatTarget } = req.body;

    // 验证输入
    if (caloriesTarget < 500 || caloriesTarget > 10000) {
      return res.status(400).json({
        success: false,
        message: '卡路里目标必须在500-10000之间'
      });
    }

    if (proteinTarget < 10 || proteinTarget > 300) {
      return res.status(400).json({
        success: false,
        message: '蛋白质目标必须在10-300之间'
      });
    }

    if (fatTarget < 10 || fatTarget > 200) {
      return res.status(400).json({
        success: false,
        message: '脂肪目标必须在10-200之间'
      });
    }

    // 更新用户设置
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        settings: {
          caloriesTarget,
          proteinTarget,
          fatTarget
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: user.settings
    });
  } catch (err) {
    next(err);
  }
}; 