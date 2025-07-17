const Donor = require('../models/donorModel')

exports.getDonor = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    if (!ssn) {
      return res.redirect('/index');
    }
    const latestNotifications = await Donor.getNotificationsBySSN(ssn, 3);
    const donorName = req.session.user && req.session.user.name;
    res.render('donor/donor', { latestNotifications, donorName });
  } catch (error) {
    console.error('Error fetching donor dashboard:', error);
    res.render('donor/donor', { latestNotifications: [], errorMessage: 'Could not fetch notifications.' });
  }
}
exports.getTrackRecord = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    if (!ssn) {
      return res.redirect('/index');
    }
    const trackRecords = await Donor.getTrackRecordsFromHaveRequest(ssn);
    res.render('donor/track-record', { trackRecords });
  } catch (error) {
    console.error('Error fetching donor track record:', error);
    res.render('donor/track-record', { trackRecords: [], errorMessage: 'Could not fetch track record.' });
  }
}
exports.getNotifications = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    if (!ssn) {
      return res.redirect('/index');
    }
    const notifications = await Donor.getNotificationsBySSN(ssn);
    res.render('donor/notifications', { notifications });
  } catch (error) {
    console.error('Error fetching donor notifications:', error);
    res.render('donor/notifications', { notifications: [], errorMessage: 'Could not fetch notifications.' });
  }
}   
exports.getBenefits=(req,res,next)=>{     
  res.render('donor/benefits');
} 