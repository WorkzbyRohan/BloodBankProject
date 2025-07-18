const Donor = require('../models/donorModel')

exports.getDonor = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    if (!ssn) {
      return res.redirect('/index');
    }
    const latestNotifications = await Donor.getNotificationsBySSN(ssn, 3);
    const donorName = req.session.user && req.session.user.name;
    const totalDonations = await Donor.countCompletedDonations(ssn);
    let tier = 'Tier 1';
    let toNextTier = 10 - totalDonations;
    if (totalDonations >= 25) {
      tier = 'Tier 3';
      toNextTier = 0;
    } else if (totalDonations >= 10) {
      tier = 'Tier 2';
      toNextTier = 25 - totalDonations;
    }
    res.render('donor/donor', { latestNotifications, donorName, totalDonations, tier, toNextTier });
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
exports.handleNotificationAction = async (req, res, next) => {
  try {
    const { did, action } = req.body;
    if (!did || !action) {
      return res.redirect('/donor/notifications');
    }
    await Donor.updateNotificationStatus(did, action);
    // If accepted, set all other notifications for this rid to 'Already accepted by another donor'
    if (action === 'Accepted') {
      const notification = await Donor.getNotificationById(did);
      if (notification) {
        console.log('Updating others for rid:', notification.rid, 'excluding d_SSN:', notification.d_SSN);
        await Donor.setOtherDonorsUnable(notification.rid, notification.d_SSN);
      }
    }
    // If a donor rejects after accepting, revert others and request to pending
    if (action === 'Rejected') {
      const notification = await Donor.getNotificationById(did);
      if (notification && notification.status === 'Accepted') {
        await Donor.setOtherDonorsPending(notification.rid, notification.d_SSN);
        await Donor.setRequestPending(notification.rid);
      }
    }
    res.redirect('/donor/notifications');
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.redirect('/donor/notifications');
  }
} 