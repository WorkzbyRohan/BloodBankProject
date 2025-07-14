const express = require('express');
const Patient = require('./models/patientModel');
const patientRouter = require('./Routers/patient');
const loginRouter = require('./Routers/login');
const app = express();
const PORT = 3060;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.use('/', loginRouter);
app.use('/Patient',patientRouter);

app.listen(PORT, () => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});