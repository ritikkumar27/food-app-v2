const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  profile: {
    age: { type: Number, min: 1, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: { type: Number, min: 50, max: 300 },  // cm
    weight: { type: Number, min: 10, max: 500 },  // kg
    bmi: { type: Number },
    bmiCategory: { type: String, enum: ['underweight', 'normal', 'overweight', 'obese'] },
    diseases: [{
      type: String,
      enum: ['diabetes', 'hypertension', 'heart_disease', 'kidney_disease'],
    }],
    dietaryPreference: { type: String, enum: ['veg', 'non-veg'], default: 'non-veg' },
    profileCompleted: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

// Never return password in JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
