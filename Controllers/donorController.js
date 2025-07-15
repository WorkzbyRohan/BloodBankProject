const Donor = require('../models/donorModel')

exports.getDonor=(req,res,next)=>{
  res.render('donor/donor');
}
exports.getTrackRecord=(req,res,next)=>{
  res.render('donor/track-record');
} 
exports.getNotifications=(req,res,next)=>{
  res.render('donor/notifications');
}   
exports.getBenefits=(req,res,next)=>{     
  res.render('donor/benefits');
} 