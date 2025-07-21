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
    // For each notification, calculate remaining required bottles
    for (const notification of notifications) {
      if (notification.status === 'Pending' || notification.status === 'Already accepted by another donor') {
        // Get required quantity from make_request
        const [[{ Quantity: requiredQuantity } = {}]] = await require('../utils/databaseUtil').execute(
          "SELECT Quantity FROM make_request WHERE rid = ?",
          [notification.rid]
        );
        // Sum all accepted/completed quantities for this request
        const [[{ totalAccepted = 0 } = {}]] = await require('../utils/databaseUtil').execute(
          "SELECT SUM(quantity) as totalAccepted FROM have_request WHERE rid = ? AND status IN ('Accepted', 'Completed')",
          [notification.rid]
        );
        notification.remainingBottles = Math.max((requiredQuantity || 0) - (totalAccepted || 0), 0);
      }
    }
    res.render('donor/notifications', { notifications });
  } catch (error) {
    console.error('Error fetching donor notifications:', error);
    res.render('donor/notifications', { notifications: [], errorMessage: 'Could not fetch notifications.' });
  }
}   
exports.getBenefits = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    const allBenefits = await Donor.getAllBenefits();
    const earnedBenefits = await Donor.getEarnedBenefits(ssn);
    res.render('donor/benefits', { allBenefits, earnedBenefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    res.render('donor/benefits', { allBenefits: [], earnedBenefits: [], errorMessage: 'Could not fetch benefits.' });
  }
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
      const { quantity } = req.body;
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.redirect('/donor/notifications');
      }
      // Save the quantity for this donor's have_request row
      await require('../utils/databaseUtil').execute(
        'UPDATE have_request SET quantity = ? WHERE did = ?',
        [quantity, did]
      );
      // Do NOT update other donors or the request here. Wait for patient approval.
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