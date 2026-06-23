const { DataTypes } = require('sequelize');

function defineQueueSettingsModel(sequelize) {
  return sequelize.define('QueueSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    current_token: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    next_token: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    average_consultation_time: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false,
    },
    patients_served: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  }, {
    tableName: 'queue_settings',
    underscored: true,
  });
}

module.exports = defineQueueSettingsModel;
