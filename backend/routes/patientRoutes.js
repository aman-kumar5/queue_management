const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

router.get('/', patientController.getPatients);
router.post('/', patientController.createPatient);

module.exports = router;
