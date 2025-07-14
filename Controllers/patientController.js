const Patient = require('../models/patientModel');

exports.getPatient = (req, res, next) => {
  res.render('patient/patient');
}
exports.getRequestBlood = (req, res, next) => {
  res.render('patient/request-blood');
}

exports.getRequestHistory = (req, res, next) => {
  res.render('patient/request-history');
}

exports.getPatientNotification= (req, res, next) => {
  res.render('patient/p-notification');
}