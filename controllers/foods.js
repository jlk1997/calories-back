const FoodDatabase = require('../models/FoodDatabase');
const CustomFood = require('../models/CustomFood');

// @desc    搜索食物
// @route   GET /api/foods/search
// @access  私有
exports.searchFoods = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }

    // 创建文本搜索查询
    const query = { $text: { $search: q } };

    // 从食物数据库中搜索
    const systemFoods = await FoodDatabase.find(query)
      .sort({ popularity: -1 })
      .limit(10);

    // 从自定义食物中搜索 (当前用户的和公开的)
    const customFoods = await CustomFood.find({
      $or: [
        { userId: req.user.id },
        { isPublic: true }
      ],
      $text: { $search: q }
    }).limit(10);

    // 如果没有精确的文本匹配，则执行模糊搜索
    let systemFoodsRegex = [];
    let customFoodsRegex = [];

    if (systemFoods.length === 0) {
      systemFoodsRegex = await FoodDatabase.find({
        name: { $regex: q, $options: 'i' }
      })
        .sort({ popularity: -1 })
        .limit(10);
    }

    if (customFoods.length === 0) {
      customFoodsRegex = await CustomFood.find({
        $or: [
          { userId: req.user.id },
          { isPublic: true }
        ],
        name: { $regex: q, $options: 'i' }
      }).limit(10);
    }

    // 合并结果
    const results = [
      ...systemFoods,
      ...customFoods,
      ...systemFoodsRegex,
      ...customFoodsRegex
    ];

    // 去重
    const uniqueResults = Array.from(
      new Set(results.map(food => food.id))
    ).map(id => results.find(food => food.id === id));

    res.status(200).json({
      success: true,
      count: uniqueResults.length,
      data: uniqueResults
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取热门食物
// @route   GET /api/foods/popular
// @access  私有
exports.getPopularFoods = async (req, res, next) => {
  try {
    // 获取系统食物库中最受欢迎的10个食物
    const popularSystemFoods = await FoodDatabase.find()
      .sort({ popularity: -1 })
      .limit(10);

    // 获取公开的自定义食物中最受欢迎的5个
    const popularCustomFoods = await CustomFood.find({ isPublic: true })
      .sort({ popularity: -1 })
      .limit(5);

    // 合并结果
    const results = [...popularSystemFoods, ...popularCustomFoods];

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    添加自定义食物
// @route   POST /api/foods/custom
// @access  私有
exports.addCustomFood = async (req, res, next) => {
  try {
    const { name, calories, protein, fat, carbs, isPublic } = req.body;

    // 验证输入
    if (!name || !calories || protein === undefined || fat === undefined || carbs === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必要的食物信息'
      });
    }

    // 创建自定义食物
    const customFood = await CustomFood.create({
      name,
      calories,
      protein,
      fat,
      carbs,
      isPublic: isPublic || false,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: customFood
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取用户的自定义食物
// @route   GET /api/foods/custom
// @access  私有
exports.getUserCustomFoods = async (req, res, next) => {
  try {
    const customFoods = await CustomFood.find({ userId: req.user.id });

    res.status(200).json({
      success: true,
      count: customFoods.length,
      data: customFoods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    更新自定义食物
// @route   PUT /api/foods/custom/:id
// @access  私有
exports.updateCustomFood = async (req, res, next) => {
  try {
    const { name, calories, protein, fat, carbs, isPublic } = req.body;

    // 查找并确认所有权
    let customFood = await CustomFood.findById(req.params.id);

    if (!customFood) {
      return res.status(404).json({
        success: false,
        message: '找不到该食物'
      });
    }

    // 确认用户拥有这个食物
    if (customFood.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此食物'
      });
    }

    // 更新食物
    customFood = await CustomFood.findByIdAndUpdate(
      req.params.id,
      {
        name,
        calories,
        protein,
        fat,
        carbs,
        isPublic
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: customFood
    });
  } catch (err) {
    next(err);
  }
};

// @desc    删除自定义食物
// @route   DELETE /api/foods/custom/:id
// @access  私有
exports.deleteCustomFood = async (req, res, next) => {
  try {
    // 查找并确认所有权
    const customFood = await CustomFood.findById(req.params.id);

    if (!customFood) {
      return res.status(404).json({
        success: false,
        message: '找不到该食物'
      });
    }

    // 确认用户拥有这个食物
    if (customFood.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此食物'
      });
    }

    // 删除食物
    await customFood.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 