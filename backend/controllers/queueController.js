const { models } = require('../models');
const { getSequelize } = require('../config/db');
const { Op } = require('sequelize');

// Helper to get or create default queue settings
async function getOrCreateSettings(transaction) {
  let settings = await models.QueueSettings.findByPk(1, { transaction });
  if (!settings) {
    settings = await models.QueueSettings.create({
      id: 1,
      current_token: 0,
      next_token: 1,
      average_consultation_time: 10,
      patients_served: 0
    }, { transaction });
  }
  return settings;
}

// Helper to complete the active patient and calculate duration
async function completeActivePatient(transaction) {
  const activePatient = await models.Patient.findOne({
    where: { status: 'in_consultation' },
    transaction
  });

  if (activePatient) {
    const endTime = new Date();
    const calledTime = activePatient.called_at || activePatient.updated_at;
    const durationMs = endTime - new Date(calledTime);
    // duration in minutes (as a float for precise average computation)
    const durationMins = Math.max(0.1, durationMs / 60000); 

    activePatient.status = 'completed';
    activePatient.consultation_duration = durationMins;
    await activePatient.save({ transaction });
    return activePatient;
  }
  return null;
}

// Helper to process patient completion and update average time at multiples of 3
async function handlePatientCompletion(transaction) {
  // 1. Count completed patients
  const completedCount = await models.Patient.count({
    where: { status: 'completed' },
    transaction
  });

  // 2. If it's a multiple of 3 (3, 6, 9...), recalculate average consultation time
  if (completedCount > 0 && completedCount % 3 === 0) {
    const result = await models.Patient.findOne({
      attributes: [
        [models.Patient.sequelize.fn('AVG', models.Patient.sequelize.col('consultation_duration')), 'avgDuration']
      ],
      where: { 
        status: 'completed',
        consultation_duration: { [Op.ne]: null }
      },
      transaction
    });

    if (result && result.getDataValue('avgDuration') !== null) {
      const rawAvg = parseFloat(result.getDataValue('avgDuration'));
      const roundedAvg = Math.max(1, Math.round(rawAvg));
      
      const settings = await getOrCreateSettings(transaction);
      settings.average_consultation_time = roundedAvg;
      await settings.save({ transaction });
      
      console.log(`Updated average consultation time to ${roundedAvg} minutes based on ${completedCount} completed patients.`);
    }
  }
}

// Get the current status of the entire queue
exports.getQueueStatus = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    
    // Count active waiting patients
    const patientsWaiting = await models.Patient.count({
      where: { status: 'waiting' }
    });

    const estimatedWait = patientsWaiting * settings.average_consultation_time;

    return res.status(200).json({
      currentToken: settings.current_token,
      nextToken: settings.next_token,
      averageConsultationTime: settings.average_consultation_time,
      patientsServed: settings.patients_served,
      patientsWaiting,
      estimatedWait
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update queue settings (Average Consultation Time)
exports.updateSettings = async (req, res) => {
  const { averageConsultationTime } = req.body;
  
  if (averageConsultationTime === undefined || isNaN(averageConsultationTime) || averageConsultationTime < 1) {
    return res.status(400).json({ error: 'Valid average consultation time is required' });
  }

  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    const settings = await getOrCreateSettings(transaction);
    settings.average_consultation_time = parseInt(averageConsultationTime, 10);
    await settings.save({ transaction });
    await transaction.commit();

    if (req.io) {
      req.io.emit('queueUpdated');
    }

    return res.status(200).json(settings);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating queue settings:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Call the next patient
exports.callNext = async (req, res) => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    const settings = await getOrCreateSettings(transaction);

    // 1. Complete the active patient and record duration
    const completedPatient = await completeActivePatient(transaction);
    if (completedPatient) {
      await handlePatientCompletion(transaction);
    }

    // 2. Find the next 'waiting' patient with lowest token_no
    const nextPatient = await models.Patient.findOne({
      where: { status: 'waiting' },
      order: [['token_no', 'ASC']],
      transaction
    });

    if (!nextPatient) {
      await transaction.commit();
      return res.status(200).json({ 
        message: 'No patients in waiting queue',
        settings 
      });
    }

    // 3. Mark this next patient as 'in_consultation' and record called time
    nextPatient.status = 'in_consultation';
    nextPatient.called_at = new Date();
    await nextPatient.save({ transaction });

    // 4. Update queue settings
    settings.current_token = nextPatient.token_no;
    settings.patients_served = settings.patients_served + 1;
    await settings.save({ transaction });

    await transaction.commit();

    if (req.io) {
      req.io.emit('queueUpdated');
    }

    return res.status(200).json({
      message: `Called patient ${nextPatient.name} (Token #${nextPatient.token_no})`,
      patient: nextPatient,
      settings
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error calling next patient:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mark the current patient as completed
exports.markCompleted = async (req, res) => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    const activePatient = await models.Patient.findOne({
      where: { status: 'in_consultation' },
      transaction
    });

    if (!activePatient) {
      await transaction.commit();
      return res.status(404).json({ error: 'No patient currently in consultation' });
    }

    const endTime = new Date();
    const calledTime = activePatient.called_at || activePatient.updated_at;
    const durationMs = endTime - new Date(calledTime);
    // duration in minutes (as a float for precise average computation)
    const durationMins = Math.max(0.1, durationMs / 60000);

    activePatient.status = 'completed';
    activePatient.consultation_duration = durationMins;
    await activePatient.save({ transaction });

    await handlePatientCompletion(transaction);

    await transaction.commit();

    if (req.io) {
      req.io.emit('queueUpdated');
    }

    return res.status(200).json({
      message: `Patient ${activePatient.name} consultation marked completed`,
      patient: activePatient
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error marking completed:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Skip a token
exports.skipToken = async (req, res) => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    // 1. Try to skip the current 'in_consultation' patient
    let patientToSkip = await models.Patient.findOne({
      where: { status: 'in_consultation' },
      transaction
    });

    // 2. If none, skip the next in line 'waiting' patient
    if (!patientToSkip) {
      patientToSkip = await models.Patient.findOne({
        where: { status: 'waiting' },
        order: [['token_no', 'ASC']],
        transaction
      });
    }

    if (!patientToSkip) {
      await transaction.commit();
      return res.status(404).json({ error: 'No active or waiting patient found to skip' });
    }

    // Set their status to completed or we can use 'skipped'
    patientToSkip.status = 'skipped';
    await patientToSkip.save({ transaction });

    await transaction.commit();

    if (req.io) {
      req.io.emit('queueUpdated');
    }

    return res.status(200).json({
      message: `Token #${patientToSkip.token_no} (${patientToSkip.name}) skipped`,
      patient: patientToSkip
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error skipping token:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Reset queue (for a new day)
exports.resetQueue = async (req, res) => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();

  try {
    // 1. Truncate patients table
    // Disable foreign key checks if needed, but since it's a standalone table:
    await models.Patient.destroy({ truncate: true, transaction });

    // 2. Reset settings to initial state
    const settings = await getOrCreateSettings(transaction);
    settings.current_token = 0;
    settings.next_token = 1;
    settings.patients_served = 0;
    settings.average_consultation_time = 10; // Reset average wait time back to default 10 minutes
    await settings.save({ transaction });

    await transaction.commit();

    if (req.io) {
      req.io.emit('queueUpdated');
    }

    return res.status(200).json({
      message: 'Queue reset successfully',
      settings
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error resetting queue:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
