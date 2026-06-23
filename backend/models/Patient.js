const { DataTypes } = require('sequelize');
const { getSequelize } = require('../config/db');

const sequelize = getSequelize();

// Note: In Sequelize, if the connection is not initialized yet, we can define the model
// dynamically or pass sequelize in a function, but since db.js loads dynamically,
// we can define a function to initialize models, or define them by retrieving the
// instance. Since we call initializeDatabase() before importing routes/models in server.js,
// we can export a function or just define the model inside an initialization step.
// Let's make db.js export the Sequelize instance after initializeDatabase runs,
// and we define models by importing the function that returns the sequelize instance.
// Better: let's define a function that takes the sequelize instance and defines the model.

function definePatientModel(sequelize) {
  return sequelize.define('Patient', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'in_consultation', 'completed', 'skipped'),
      defaultValue: 'waiting',
      allowNull: false,
    },
    called_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    consultation_duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    tableName: 'patients',
    underscored: true,
  });
}

module.exports = definePatientModel;
