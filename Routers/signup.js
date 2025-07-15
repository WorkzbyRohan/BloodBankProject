const express = require('express');
const router = express.Router();
const signupController = require('../Controllers/signupController');
const loginController = require('../Controllers/loginController');

// GET signup page
router.get('/', loginController.getSignup);

// POST signup data
router.post('/', signupController.postSignup);

module.exports = router;
