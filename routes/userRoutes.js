const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
// protect all the routes below
router.use(authController.protect);

router.patch('/change-password', authController.changePassword);
router.put(
  '/update-me',
  userController.uploadImage,
  userController.resizeImage,
  userController.updateMe
);
router.delete('/delete-me', userController.deleteMe);

router.get('/me', userController.getMe, userController.getUser);

// restrict all the routes below to only admins
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
