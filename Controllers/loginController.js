const Patient = require('../models/patientModel');
const Donor = require('../models/donorModel');

exports.getLogin = (req, res, next) => {
  res.render('index', { errorMessage: null });
}

exports.getSignup = (req, res, next) => {
  res.render('signup');
}

exports.postLogin = async (req, res, next) => {
  try {
    const { name, password, role } = req.body;
    if (role === 'patient') {
      const patient = await Patient.checkLogin(name, password);
      if (patient) {
        req.session.user = { role: 'patient', name: patient.Name, id: patient.SSN };
        res.redirect('/Patient');
      } else {
        req.session.user = null;
        res.render('index', { 
          errorMessage: 'Invalid name or password. Please sign up if you don\'t have an account.' 
        });
      }
    } else if (role === 'donor') {
      const donor = await Donor.checkLogin(name, password);
      if (donor) {
        req.session.user = { role: 'donor', name: donor.Name, id: donor.SSN };
        res.redirect('/donor/donor');
      } else {
        req.session.user = null;
        res.render('index', { 
          errorMessage: 'Invalid donor name or password. Please sign up if you don\'t have an account.' 
        });
      }
    } else {
      req.session.user = null;
      res.render('index', { 
        errorMessage: 'Please select a valid role.' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('index', { 
      errorMessage: 'An error occurred during login. Please try again.' 
    });
  }
}