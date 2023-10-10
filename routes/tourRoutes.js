const express = require('express');

const authController = require('./../controllers/authController');
const tourController = require('./../controllers/tourController');
const reviewRouter = require('./reviewRoutes');
const AppError = require('../utils/AppError');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.get(
  '/top-5-tours',
  tourController.aliasTopFiveTours,
  tourController.getAllTours
);

router.get(
  '/monthly-plans/:year',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlans
);
router.get('/stats', tourController.getToursStats);

router.get(
  '/tours-within/:distance/center/:latlong/unit/:unit',
  tourController.getToursWithin
);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadImages,
    tourController.resizeImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

router.all('*', (req, res, next) => {
  next(new AppError('Router is not exist'));
});
module.exports = router;
