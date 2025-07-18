
const express = require('express');
const donorRouter = express.Router();
const donorController = require('../Controllers/donorController');
const { isAuthenticated } = require('../middleware/auth');

donorRouter.get('/donor', isAuthenticated, donorController.getDonor);
donorRouter.get('/track-record', isAuthenticated, donorController.getTrackRecord);
donorRouter.get('/notifications', isAuthenticated, donorController.getNotifications);
donorRouter.get('/benefits', isAuthenticated, donorController.getBenefits);
donorRouter.post('/notification-action', isAuthenticated, donorController.handleNotificationAction);

module.exports = donorRouter;