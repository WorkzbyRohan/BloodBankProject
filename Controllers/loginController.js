const Patient = require('../models/patientModel');

exports.getLogin = (req, res, next) => {
  res.render('index', { errorMessage: null });
}

exports.getSignup = (req, res, next) => {
  res.render('signup');
}

exports.postLogin = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    
    const patient = await Patient.checkLogin(name, password);
    
    if (patient) {
      // Login successful, redirect to patient dashboard
      res.redirect('/Patient');
    } else {
      // Login failed, show error message
      res.render('index', { 
        errorMessage: 'Invalid name or password. Please sign up if you don\'t have an account.' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('index', { 
      errorMessage: 'An error occurred during login. Please try again.' 
    });
  }
}