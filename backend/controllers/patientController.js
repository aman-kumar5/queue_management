const { models } = require('../models');
const { getSequelize } = require('../config/db');

// Get all patients
exports.getPatients = async (req, res) => {
  try {
    const patients = await models.Patient.findAll({
      order: [['token_no', 'ASC']]
    });
    return res.status(200).json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create a new patient (Generate Token)
exports.createPatient = async (req, res) => {
  const { name, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Patient name is required' });
  }

  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    // 1. Get current queue settings (row 1)
    let settings = await models.QueueSettings.findByPk(1, { transaction });
    if (!settings) {
      // Seed if missing
      settings = await models.QueueSettings.create({
        id: 1,
        current_token: 0,
        next_token: 1,
        average_consultation_time: 10,
        patients_served: 0
      }, { transaction });
    }

    const tokenNo = settings.next_token;

    // 2. Create the patient
    const newPatient = await models.Patient.create({
      token_no: tokenNo,
      name,
      phone: phone || null,
      status: 'waiting'
    }, { transaction });

    // 3. Increment next token
    settings.next_token = tokenNo + 1;
    await settings.save({ transaction });

    await transaction.commit();

    // 4. Emit real-time update
    if (req.io) {
      req.io.emit('queueUpdated');
    }

    return res.status(201).json(newPatient);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating patient:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Token number already exists' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
