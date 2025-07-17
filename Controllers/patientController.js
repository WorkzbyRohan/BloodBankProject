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
    res.render('patient/request-history', { requests });
  } catch (error) {
    console.error('Error fetching request history:', error);
    res.render('patient/request-history', { requests: [], errorMessage: 'Could not fetch request history.' });
  }
}

exports.getPatientNotification= (req, res, next) => {
  res.render('patient/p-notification');
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