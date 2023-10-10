const AppError = require('../utils/AppError');

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'something went wrong'
    });
  }
};

const handleCastErrorDb = err => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message);
};

const handleDuplicateErrorDb = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `duplicate field ${value}, please use a different value`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleWrongTokenErrorDb = () =>
  new AppError('invalid token please login again', 401);

const handleTokenExpiredErrorDb = () =>
  new AppError('token timed out', 401);

module.exports = (err, req, res, next) => {
  err.status = err.status || 'failed';
  err.statusCode = err.statusCode || 404;
  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDb(error);
    if (error.code === 11000) error = handleDuplicateErrorDb(error);
    if (error._message === 'Validation failed')
      error = handleValidationErrorDb(error);
    if (error.name === 'JsonWebTokenError')
      error = handleWrongTokenErrorDb();
    if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredErrorDb();
    sendProdError(error, res);
  }
};
