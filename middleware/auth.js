function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/index');
  }
}

module.exports = { isAuthenticated }; 