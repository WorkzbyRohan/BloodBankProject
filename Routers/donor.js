
const express = require('express');
const donorRouter = express.Router();
const donorController = require('../Controllers/donorController');

donorRouter.get('/donor', donorController.getDonor);
donorRouter.get('/track-record', donorController.getTrackRecord);
donorRouter.get('/notifications', donorController.getNotifications);
donorRouter.get('/benefits', donorController.getBenefits);

module.exports = donorRouter;