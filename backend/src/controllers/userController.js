const User = require('../models/User');
const HealthProfileService = require('../services/HealthProfileService');

/**
 * GET /user/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /user/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { age, gender, height, weight, diseases, dietaryPreference } = req.body;

    const updateData = {};

    if (age != null) updateData['profile.age'] = age;
    if (gender != null) updateData['profile.gender'] = gender;
    if (height != null) updateData['profile.height'] = height;
    if (weight != null) updateData['profile.weight'] = weight;
    if (diseases != null) updateData['profile.diseases'] = diseases;
    if (dietaryPreference != null) updateData['profile.dietaryPreference'] = dietaryPreference;

    // Calculate BMI if weight and height are provided
    const user = await User.findById(req.userId);
    const effectiveWeight = weight || user.profile?.weight;
    const effectiveHeight = height || user.profile?.height;

    if (effectiveWeight && effectiveHeight) {
      const { bmi, category } = HealthProfileService.calculateBMI(effectiveWeight, effectiveHeight);
      updateData['profile.bmi'] = bmi;
      updateData['profile.bmiCategory'] = category;
    }

    // Mark profile as completed if all required fields are present
    const hasAge = age != null || user.profile?.age != null;
    const hasGender = gender != null || user.profile?.gender != null;
    const hasHeight = effectiveHeight != null;
    const hasWeight = effectiveWeight != null;

    if (hasAge && hasGender && hasHeight && hasWeight) {
      updateData['profile.profileCompleted'] = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
