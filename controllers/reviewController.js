const factory = require('.//factoryFunction');
const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');

exports.getAllreviews = factory.getAll(Review)

// for nested route
exports.setTourAndUserIds = catchAsync(async (req, res, next) => {
  req.body.tour = req.body.tour || req.params.tourId;
  req.body.user = req.user._id;
  next();
});
exports.addReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review, { path: 'user' });
