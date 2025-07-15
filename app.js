const express = require('express');
const Patient = require('./models/patientModel');
const Donor = require('./models/donorModel');
const patientRouter = require('./Routers/patient');
const loginRouter = require('./Routers/login');
const donorRouter = require('./Routers/donor');
const signupRouter = require('./Routers/signup');
const app = express();
const PORT = 3060;

// Add middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use('/', loginRouter);
app.use('/signup', signupRouter);
app.use('/Patient', patientRouter);
app.use('/donor', donorRouter);

app.listen(PORT, () => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});