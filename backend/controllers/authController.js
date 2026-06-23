const { models } = require('../models');

// Predefined receptionist credentials
const RECEPTIONIST_ID = 'admin';
const RECEPTIONIST_PASS = 'receptionist123';

// Login for receptionist
exports.loginReceptionist = async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ error: 'Employee ID and password are required' });
  }

  if (employeeId === RECEPTIONIST_ID && password === RECEPTIONIST_PASS) {
    return res.status(200).json({
      success: true,
      role: 'receptionist',
      message: 'Receptionist authenticated successfully'
    });
  }

  return res.status(401).json({ error: 'Invalid Employee ID or Password' });
};

// Login for patient using their registration name & phone number
exports.loginPatient = async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Patient name and phone number are required for login' });
  }

  try {
    // Look up for an active patient (waiting or in_consultation)
    const patient = await models.Patient.findOne({
      where: {
        name: name.trim(),
        phone: phone.trim(),
        status: ['waiting', 'in_consultation']
      }
    });

    if (!patient) {
      return res.status(401).json({
        error: 'Access Denied. No active waiting token found matching this name and phone number.'
      });
    }

    return res.status(200).json({
      success: true,
      role: 'patient',
      patient: {
        id: patient.id,
        token_no: patient.token_no,
        name: patient.name,
        phone: patient.phone,
        status: patient.status
      }
    });
  } catch (error) {
    console.error('Error logging in patient:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Verify if a patient is still active (used for session invalidation on queue reset or complete)
exports.verifyPatient = async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await models.Patient.findByPk(id);

    if (!patient || (patient.status !== 'waiting' && patient.status !== 'in_consultation')) {
      return res.status(200).json({ active: false });
    }

    return res.status(200).json({
      active: true,
      status: patient.status
    });
  } catch (error) {
    console.error('Error verifying patient:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
