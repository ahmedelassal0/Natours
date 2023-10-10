const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const ApiFeatures = require('./../utils/ApiFeatures');
exports.deleteOne = model =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    // check if doc exists
    if (!doc) {
      return next(
        new AppError(
          `No ${model.collection.collectionName} for id ${req.params.id}`,
          404
        )
      );
    }

    // send the response
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.createOne = model =>
  catchAsync(async (req, res, next) => {
    const doc = await model.create(req.body);
    // check if doc exists
    if (!doc) {
      return next(
        new AppError(
          `No ${model.collection.collectionName} for id ${req.params.id}`,
          404
        )
      );
    }

    // send the response
    res.status(201).json({
      status: 'success',
      data: doc
    });
  });

exports.updateOne = model =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // check if doc exists
    if (!doc) {
      return next(new AppError(`No docs for id ${req.params.id}`, 404));
    }

    // send the response
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getOne = (model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const query = model.findById(req.params.id);
    if (populateOptions) query.populate(populateOptions);
    const doc = await query;

    // check if doc exists
    if (!doc) {
      return next(
        new AppError(
          `No ${model.collection.collectionName} for id ${req.params.id}`,
          404
        )
      );
    }

    // send the response
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = model =>
  catchAsync(async (req, res, next) => {
    // for nested routes of review
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Prepare the query
    const features = new ApiFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .fieldLimit()
      .paginate();
    // Excute the query
    const doc = await features.query;
    // Send response
    res.status(200).json({
      length: doc.length,
      status: 'success',
      requestedAt: req.requestTime,
      data: doc
    });
  });
