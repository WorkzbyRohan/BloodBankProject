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
      // Fetch all donors and their quantities for this request, including SSN
      const [donorList] = await require('../utils/databaseUtil').execute(
        "SELECT d.Name, d.`contact-no`, d.SSN, hr.quantity, hr.status FROM have_request hr JOIN donor d ON hr.d_SSN = d.SSN WHERE hr.rid = ? AND hr.status IN ('Accepted', 'Completed')",
        [req.rid]
      );
      req.donorList = donorList.map(d => ({
        ...d,
        canApproveDonor: d.status === 'Accepted'
      }));
      req.totalFulfilled = donorList.filter(d => d.status === 'Completed').reduce((sum, d) => sum + (d.quantity || 0), 0);
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
      // Find the patient to get their location
      const patient = await Patient.getBySSN(SSN);
      // Find donors with the same blood group AND location and notify them
      const donors = await MakeRequest.getDonorsByBloodGroupAndLocation(BloodType, patient.location);
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
    const { rid, donorSSN } = req.body;
    if (!rid || !donorSSN) return res.redirect('/patient/request-history');
    console.log('Approving donor', donorSSN, 'for request', rid);
    const [updateResult] = await require('../utils/databaseUtil').execute(
      "UPDATE have_request SET status = 'Completed' WHERE rid = ? AND d_SSN = ? AND status = 'Accepted'",
      [rid, donorSSN]
    );
    console.log('Rows affected in have_request:', updateResult.affectedRows);
    // Check if total completed bottles meets requirement
    const [[{ totalCompleted = 0 } = {}]] = await require('../utils/databaseUtil').execute(
      "SELECT SUM(quantity) as totalCompleted FROM have_request WHERE rid = ? AND status = 'Completed'",
      [rid]
    );
    const [[{ Quantity: requiredQuantity } = {}]] = await require('../utils/databaseUtil').execute(
      "SELECT Quantity FROM make_request WHERE rid = ?",
      [rid]
    );
    if (totalCompleted >= requiredQuantity) {
      // Set the make_request status to Fulfilled
      await require('../utils/databaseUtil').execute(
        "UPDATE make_request SET Status = 'Fulfilled' WHERE rid = ?",
        [rid]
      );
      // Set all other donors to Already accepted by another donor
      await require('../utils/databaseUtil').execute(
        "UPDATE have_request SET status = 'Already accepted by another donor' WHERE rid = ? AND status NOT IN ('Completed', 'Rejected')",
        [rid]
      );
      console.log('Request', rid, 'fulfilled.');
    }
    res.redirect('/patient/request-history');
  } catch (error) {
    console.error('Error approving request:', error);
    res.redirect('/patient/request-history');
  }
}