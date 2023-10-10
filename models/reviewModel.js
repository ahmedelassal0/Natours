const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'sorry you did not write the review']
    },
    rating: {
      type: Number,
      required: [true, 'rating is required'],
      max: 5,
      min: 1
    },
    createdAt: {
      type: Date,
      dafault: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email'
  });
  next();
});

// update rating average and rating quantity of a tour
reviewSchema.statics.calcRatingAverage = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        ratingsAverage: { $avg: '$rating' },
        nRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].ratingsAverage,
      ratingsQuantity: stats[0].ratingsAverage
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
  console.log(stats);
};

// prevent the user from add more than one review
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

// update reviews average after save
reviewSchema.post('save', function() {
  this.constructor.calcRatingAverage(this.tour);
});

// update reviews average after update and delete
reviewSchema.post(/^findOneAnd/, async function(doc) {
  await doc.constructor.calcRatingAverage(doc.tour);
});

module.exports = mongoose.model('Review', reviewSchema);
