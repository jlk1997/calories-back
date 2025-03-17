const MealEntry = require('../models/MealEntry');

// @desc    获取指定日期的餐食记录
// @route   GET /api/meals?date=YYYY-MM-DD
// @access  私有
exports.getMealsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: '请提供日期参数'
      });
    }

    // 查找当前用户指定日期的餐食记录
    let mealEntry = await MealEntry.findOne({
      userId: req.user.id,
      date
    });

    // 如果没有记录，返回空数据
    if (!mealEntry) {
      return res.status(200).json({
        success: true,
        data: {
          date,
          meals: [],
          totalCalories: 0,
          totalProtein: 0,
          totalFat: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: mealEntry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    添加餐食记录
// @route   POST /api/meals
// @access  私有
exports.addMeal = async (req, res, next) => {
  try {
    const { date, foodId, name, amount, calories, protein, fat, carbs } = req.body;

    if (!date || !foodId || !name || !amount || calories === undefined || 
        protein === undefined || fat === undefined || carbs === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必要的餐食信息'
      });
    }

    // 查找当前用户指定日期的餐食记录
    let mealEntry = await MealEntry.findOne({
      userId: req.user.id,
      date
    });

    // 如果没有记录，创建新记录
    if (!mealEntry) {
      mealEntry = await MealEntry.create({
        userId: req.user.id,
        date,
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0
      });
    }

    // 创建新的餐食项
    const newMeal = {
      foodId,
      name,
      amount,
      calories,
      protein,
      fat,
      carbs,
      timestamp: new Date()
    };

    // 添加到餐食记录
    mealEntry.meals.push(newMeal);

    // 更新总计
    mealEntry.totalCalories += parseInt(calories);
    mealEntry.totalProtein = (parseFloat(mealEntry.totalProtein) + parseFloat(protein)).toFixed(1);
    mealEntry.totalFat = (parseFloat(mealEntry.totalFat) + parseFloat(fat)).toFixed(1);

    // 保存更新后的记录
    await mealEntry.save();

    res.status(201).json({
      success: true,
      data: mealEntry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    删除餐食记录
// @route   DELETE /api/meals/:date/:mealId
// @access  私有
exports.removeMeal = async (req, res, next) => {
  try {
    const { date, mealId } = req.params;

    // 查找当前用户指定日期的餐食记录
    let mealEntry = await MealEntry.findOne({
      userId: req.user.id,
      date
    });

    if (!mealEntry) {
      return res.status(404).json({
        success: false,
        message: '找不到该日期的餐食记录'
      });
    }

    // 查找要删除的餐食项
    const mealIndex = mealEntry.meals.findIndex(
      meal => meal._id.toString() === mealId
    );

    if (mealIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到该餐食记录'
      });
    }

    // 获取要删除的餐食项
    const removedMeal = mealEntry.meals[mealIndex];

    // 更新总计
    mealEntry.totalCalories -= parseInt(removedMeal.calories);
    mealEntry.totalProtein = (parseFloat(mealEntry.totalProtein) - parseFloat(removedMeal.protein)).toFixed(1);
    mealEntry.totalFat = (parseFloat(mealEntry.totalFat) - parseFloat(removedMeal.fat)).toFixed(1);

    // 确保不为负数
    if (mealEntry.totalCalories < 0) mealEntry.totalCalories = 0;
    if (parseFloat(mealEntry.totalProtein) < 0) mealEntry.totalProtein = '0.0';
    if (parseFloat(mealEntry.totalFat) < 0) mealEntry.totalFat = '0.0';

    // 从餐食记录中移除
    mealEntry.meals.splice(mealIndex, 1);

    // 保存更新后的记录
    await mealEntry.save();

    res.status(200).json({
      success: true,
      data: mealEntry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取历史餐食记录
// @route   GET /api/meals/history?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  私有
exports.getMealHistory = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: '请提供开始和结束日期'
      });
    }

    // 查找日期范围内的所有餐食记录
    const mealEntries = await MealEntry.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // 计算每日摄入总量
    const dailySummary = mealEntries.map(entry => ({
      date: entry.date,
      totalCalories: entry.totalCalories,
      totalProtein: entry.totalProtein,
      totalFat: entry.totalFat
    }));

    res.status(200).json({
      success: true,
      count: mealEntries.length,
      data: {
        entries: mealEntries,
        summary: dailySummary
      }
    });
  } catch (err) {
    next(err);
  }
}; 