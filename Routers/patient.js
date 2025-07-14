const express=require('express');
const patientRouter=express.Router();
const patientController=require('../Controllers/patientController');
const db=require('../utils/databaseUtil');


patientRouter.get('/', patientController.getPatient);
patientRouter.get('/patient', patientController.getPatient);
patientRouter.get('/request-blood', patientController.getRequestBlood);
patientRouter.get('/request-history',patientController.getRequestHistory);
patientRouter.get('/p-notification',patientController.getPatientNotification);
module.exports = patientRouter;

