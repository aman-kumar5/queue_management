const definePatient = require('./Patient');
const defineQueueSettings = require('./QueueSettings');

const db = {
  Patient: null,
  QueueSettings: null,
};

function initModels(sequelize) {
  db.Patient = definePatient(sequelize);
  db.QueueSettings = defineQueueSettings(sequelize);
  
  return db;
}

module.exports = {
  initModels,
  models: db,
};
