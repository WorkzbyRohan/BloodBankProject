const Patient = require('../models/patientModel');
const Donor = require('../models/donorModel');

exports.postSignup = async (req, res, next) => {
    try {
        const { role, name, ssn, contact, bloodType, gender, password } = req.body;

        if (role === 'patient') {
            // Create new patient
            const result = await Patient.create({
                name,
                ssn,
                'contact-no': contact,  // Match the database column name
                bloodType,
                gender,
                password
            });

            if (result) {
                // Successful signup, redirect to login
                res.redirect('/index');
            } else {
                // Something went wrong
                res.render('signup', { 
                    errorMessage: 'Error creating account. Please try again.' 
                });
            }
        } else if (role === 'donor') {
            // Create new donor
            const result = await Donor.create({
                name,
                ssn,
                'contact-no': contact,  // Match the database column name
                bloodType,
                gender,
                password
            });

            if (result) {
                // Successful signup, redirect to login
                res.redirect('/index');
            } else {
                // Something went wrong
                res.render('signup', { 
                    errorMessage: 'Error creating donor account. Please try again.' 
                });
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup', { 
            errorMessage: 'An error occurred during signup. Please try again.' 
        });
    }
};
