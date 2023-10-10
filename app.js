const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/globalErrorHandler');

// routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');



const app = express();

// 1) MIDDLEWARES
// set security headers
app.use(helmet());
// set rate limit for an ip
const rateLimiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again after an hour'
});
app.use('/api', rateLimiter);

// set sanitization against noSQL injection
app.use(mongoSanitize());

// set security against XSS attacks
app.use(xss());

// clean http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// parse request date to JSON
app.use(express.json({ limit: '10kb' }));

// read static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// set development console.log
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// 4) HANDLE UNHANDLED ROUTES
app.all('*', (req, res, next) => {
  next(new AppError(`the route ${req.originalUrl} is not exist`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
