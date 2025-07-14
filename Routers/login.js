
const express = require('express');
const loginRouter = express.Router();
const loginController = require('../Controllers/loginController');

loginRouter.get('/', loginController.getLogin);
loginRouter.get('/index', loginController.getLogin);
loginRouter.get('/signup', loginController.getSignup);


module.exports = loginRouter;

