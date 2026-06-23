const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/reception', authController.loginReceptionist);
router.post('/patient', authController.loginPatient);
router.get('/verify/:id', authController.verifyPatient);

module.exports = router;
