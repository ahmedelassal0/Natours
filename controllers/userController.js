const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./factoryFunction');
const User = require('./../models/userModel');

// multer options
// const multerStorage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'public/imgs/users');
//   },
//   filename: function(req, file, cb) {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) return cb(null, true);
  else return cb(new AppError('Sorry, Only images allowed', 400), false);
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
exports.uploadImage = upload.single('photo');

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users${req.file.filename}`);
  next();
});
exports.updateMe = catchAsync(async (req, res, next) => {
  // make sure the body does not contain the password field
  if (req.body.password || req.body.passwordConfirmation)
    return next(new AppError('the password is not changing here', 400));
  // update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      password: req.body.password,
      photo: req.file.filename
    },
    { new: true, runValidators: true }
  );

  console.log(req.body);
  console.log(req.file);
  // send the response
  res.status(200).json({
    status: 'success',
    user: updatedUser
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'success', data: null });
});

exports.getAllUsers = factory.getAll(User);

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'This route is not defined!, use login instead.'
  });
};

// DO NOT use for changing password (no validation on it)
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
