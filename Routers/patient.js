const express=require('express');
const patientRouter=express.Router();
const patientController=require('../Controllers/patientController');
const db=require('../utils/databaseUtil');
const { isAuthenticated } = require('../middleware/auth');


patientRouter.get('/', isAuthenticated, patientController.getPatient);
patientRouter.get('/patient', isAuthenticated, patientController.getPatient);
patientRouter.get('/request-blood', isAuthenticated, patientController.getRequestBlood);
patientRouter.get('/request-history', isAuthenticated, patientController.getRequestHistory);
patientRouter.get('/p-notification', isAuthenticated, patientController.getPatientNotification);
patientRouter.post('/submit-request', isAuthenticated, patientController.postRequestBlood);
module.exports = patientRouter;

