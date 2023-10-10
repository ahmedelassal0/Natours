const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name is required']
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    unique: [true, 'email must be unique'],
    lowercase: true,
    validate: [validator.isEmail, 'please enter a valid email']
  },
  photo: { type: String, default: 'default.jpg' },
  password: {
    type: String,
    required: [true, 'password is required'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'confirm password is required'],
    validate: [
      function(confPass) {
        return confPass === this.password;
      },
      'password does not match'
    ]
  },
  role: {
    type: String,
    enum: ['admin', 'guide', 'lead-guide', 'user'],
    default: 'user'
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiration: Date,
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.pre('save', async function(next) {
  // check if password is entered by the user
  if (!this.isModified('password')) return next();

  // hash the password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// get only active users
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  inputPassword,
  userPassword
) {
  return await bcrypt.compare(inputPassword, userPassword);
};

// check if password changed after the generation of the token
userSchema.methods.isPasswordChangedAfterToken = function(JWTExpirationTime) {
  if (this.passwordChangedAt) {
    changePasswordDate = parseInt(this.passwordChangedAt.getTime() / 1000);
    return changePasswordDate > JWTExpirationTime;
  }
  return false;
  /* 
  false means password does not change or has changed after generating the token
  */
};

// generate forgot password token
userSchema.methods.createForgotPasswordToken = function() {
  // 1) generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 2) encrypt the token and save it to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpiration = Date.now() + 10 * 1000 * 60;

  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};
module.exports = mongoose.model('User', userSchema);
