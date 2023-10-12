const { promisify } = require('util');

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const Email = require('./../utils/email');
const User = require('./../models/userModel');

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION
  });
};

const cookieOptions = {
  expiresIn: Date.now(
    process.env.COOKIE_EXPIRE_DATE + 90 * 24 * 60 * 60 * 1000
  ),
  // secure: true,
  httpOnly: true
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  // const user = new User(req.body);
  await user.save();

  // send welcome email
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();
  const token = generateToken(user._id);

  res.cookie('jwt', token, cookieOptions);
  res.json({
    status: 'success',
    data: { user: { ...user._doc, password: undefined } },
    token
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  // check if user exists and password correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('invalid email or password', 401));
  }
  // generate tokn
  const token = generateToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  // send response
  res.status(201).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // check if user sent the token
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return next(new AppError('please login to access', 401));
  }

  let token = req.headers.authorization.split(' ')[1];
  res.cookie('jwt', token, cookieOptions);

  // check if token is valid
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  // check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('the user belongs to that token is no longer exist', 401)
    );
  }
  // check if the user changed his password after token generated
  if (currentUser.isPasswordChangedAfterToken(decoded.iat)) {
    return next(
      new AppError(
        'the password has been changed recently, please login again',
        401
      )
    );
  }
  req.user = currentUser;
  return next();
});

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("sorry, you don't have permissions to do that", 403)
      );
    return next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) check if user sent a valid email
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('this email is not defined', 404));
  // 2) generate random token that used to update an email
  const resetToken = user.createForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token to user's email
  /* create the message and url for change password
   (we will send them through the email)*/
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;
  const message = `Forgot Password? go through this URL to change it: ${resetURL}`;

  try {
    // sendEmail({
    //   email: user.email,
    //   subject: 'Natours password reset token (available for 10 inutes)',
    //   message
    // });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiration = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('An error occurred while sending email', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'please chek your email'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiration: { $gt: Date.now() }
  });

  console.log(user);
  // 2) check if the password reset expiration date expired
  if (!user) return next(new AppError('token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiration = undefined;
  await user.save();

  // console.log the user
  res.status(200).json({
    status: 'success',
    data: user
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  // 1) get current user
  const user = await User.findById(req.user._id).select('+password');

  console.log();
  // 3) if password match, update password
  if (!(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError('password is not correct', 401));

  // 4) generate the JWT log the user
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now();
  await user.save();
  const token = generateToken(user.id);
  res.cookie('jwt', token, cookieOptions);

  // 4) send response
  res.status(200).json({
    status: 'success',
    token
  });
});
