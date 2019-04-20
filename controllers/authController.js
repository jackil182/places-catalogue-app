const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now login'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLogedIn = (req, res, next) => {
  // check if user is authenticated
  if (req.isAuthenticated()) {  // isAuthenticated is passport method
    next(); // carry on
    return;
  }
  req.flash('error', 'Oops! You must be logged in to do that');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // see if user exists
  const user = await User.findOne({email: req.body.email});
  if(!user) {
    req.flash('error', 'No account with that email exists.')
    return res.redirect('/login');
  }

  // reset tokents and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  // send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset'
  });

  req.flash('success', `You have been emailed the password reset link.`);

  // redirect to login page after token has been sent
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if(!user) {
    req.flash('error', 'Password reset is invalid or expired');
    return res.redirect('/login');
  }

  // if there is a user, show the reset password form
  res.render('reset', {title: 'Reset your password'});
};

exports.confirmedPassword = (req, res, next) => {
  if(req.body.password === req.body["password-confirm"]) {
    next(); // keep it going
    return;
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if(!user) {
    req.flash('error', 'Password reset is invalid or expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  const updatedUser = await user.save();
  // user passport method login that was attached to req
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset! You are now logged in!');
  res.redirect('/');
};