const Patient = require('../models/patientModel');
const MakeRequest = require('../models/makeRequestModel');

exports.getPatient = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    if (!ssn) {
      return res.redirect('/index');
    }
    const total = await MakeRequest.countBySSN(ssn);
    const pending = await MakeRequest.countBySSNAndStatus(ssn, 'Pending');
    const fulfilled = await MakeRequest.countBySSNAndStatus(ssn, 'Fulfilled');
    const latestRequest = (await MakeRequest.getBySSN(ssn))[0] || null;
    const patientInfo = await Patient.getBySSN(ssn);
    const patientName = patientInfo ? patientInfo.Name : '';
    res.render('patient/patient', { total, pending, fulfilled, latestRequest, patientInfo, patientName });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.render('patient/patient', { total: 0, pending: 0, fulfilled: 0, errorMessage: 'Could not fetch stats.' });
  }
}
exports.getRequestBlood = (req, res, next) => {
  res.render('patient/request-blood');
}

exports.getRequestHistory = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    if (!ssn) {
      return res.redirect('/index');
    }
    const requests = await MakeRequest.getBySSN(ssn);
    // Attach donor info for completed requests
    for (const req of requests) {
      if (req.Status === 'Fulfilled') {
        const [donorRows] = await require('../utils/databaseUtil').execute(
          "SELECT d.Name, d.`contact-no` FROM donor d JOIN have_request hr ON d.SSN = hr.d_SSN WHERE hr.rid = ? AND hr.status = 'Completed' LIMIT 1",
          [req.rid]
        );
        req.donorName = donorRows[0]?.Name || '';
        req.donorContact = donorRows[0]?.['contact-no'] || '';
      }
      // Check if any donor has accepted
      const [acceptedRows] = await require('../utils/databaseUtil').execute(
        "SELECT d.Name, d.`contact-no` FROM donor d JOIN have_request hr ON d.SSN = hr.d_SSN WHERE hr.rid = ? AND hr.status = 'Accepted' LIMIT 1",
        [req.rid]
      );
      if (acceptedRows.length > 0) {
        req.hasAcceptedDonor = true;
        req.donorName = acceptedRows[0].Name;
        req.donorContact = acceptedRows[0]['contact-no'];
      }
    }
    res.render('patient/request-history', { requests });
  } catch (error) {
    console.error('Error fetching request history:', error);
    res.render('patient/request-history', { requests: [], errorMessage: 'Could not fetch request history.' });
  }
}

exports.getPatientNotification = async (req, res, next) => {
  try {
    const ssn = req.session.user && req.session.user.id;
    const [notifications] = await require('../utils/databaseUtil').execute(
      `SELECT hr.status, d.Name, d.\`contact-no\`, mr.Hospital
       FROM make_request mr
       JOIN have_request hr ON mr.rid = hr.rid
       JOIN donor d ON hr.d_SSN = d.SSN
       WHERE mr.SSN = ?
       AND hr.status IN ('Accepted', 'Rejected', 'Completed')
       ORDER BY hr.did DESC`,
      [ssn]
    );
    res.render('patient/p-notification', { notifications });
  } catch (error) {
    console.error('Error fetching patient notifications:', error);
    res.render('patient/p-notification', { notifications: [], errorMessage: 'Could not fetch notifications.' });
  }
}

exports.postRequestBlood = async (req, res, next) => {
  console.log('Request body:', req.body); // Debug log
  try {
    const { Name, SSN, 'Contact-No': ContactNo, BloodType, Hospital, Date, Quantity } = req.body;
    const result = await MakeRequest.create({
      Name,
      SSN,
      'Contact-No': ContactNo,
      BloodType,
      Hospital,
      Date,
      Quantity
    });
    if (result) {
      // Find donors with the same blood group and notify them
      const donors = await MakeRequest.getDonorsByBloodGroup(BloodType);
      // Get the latest request for this patient (to get the rid and hospital)
      const latestRequest = await MakeRequest.getLatestRequestBySSN(SSN);
      if (latestRequest && donors.length > 0) {
        for (const donor of donors) {
          const msg = `Your blood is needed at ${Hospital}. Please donate if you can.`;
          const notifyResult = await MakeRequest.createNotification(donor.SSN, latestRequest.rid, msg);
          console.log('Notification for donor:', donor.SSN, 'Result:', notifyResult);
        }
      }
      res.redirect('/patient/request-history');
    } else {
      res.render('patient/request-blood', { errorMessage: 'Error submitting request. Please try again.' });
    }
  } catch (error) {
    console.error('Blood request error:', error);
    res.render('patient/request-blood', { errorMessage: 'An error occurred. Please try again.' });
  }
}

exports.approveRequest = async (req, res, next) => {
  try {
    const { rid } = req.body;
    if (!rid) return res.redirect('/patient/request-history');
    // Set the accepted donor's have_request status to Completed
    await require('../utils/databaseUtil').execute(
      "UPDATE have_request SET status = 'Completed' WHERE rid = ? AND status = 'Accepted'",
      [rid]
    );
    // Set the make_request status to Fulfilled
    await require('../utils/databaseUtil').execute(
      "UPDATE make_request SET Status = 'Fulfilled' WHERE rid = ?",
      [rid]
    );
    res.redirect('/patient/request-history');
  } catch (error) {
    console.error('Error approving request:', error);
    res.redirect('/patient/request-history');
  }
}