const express = require('express');
const router = express.Router();

const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
// router.get('/', (req, res) => {
//   // res.send('Hey! It works!');
//   res.render('hello', {
//     name: 'Mark',
//     dog: req.query.dog,
//     title: 'Good food',
//   });
// });

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));

router.get('/add', authController.isLogedIn, storeController.addStore);

router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

router.get('/logout', authController.logout);

// 1. Validate the registration data
// 2. register the user
// 3. log them in
router.post(
  '/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/account', authController.isLogedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));

router.get('/account/reset/:token', catchErrors(authController.reset));
router.post(
  '/account/reset/:token',
  authController.confirmedPassword,
  catchErrors(authController.update)
);

router.get('/map', storeController.mapPage);
router.get('/hearts/page/:page', authController.isLogedIn, catchErrors(storeController.getHearts));
router.post('/reviews/:id', authController.isLogedIn, catchErrors(reviewController.addReview));
router.get('/top', catchErrors(storeController.getTopStores));


// API ROUTES

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));

router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));


module.exports = router;
