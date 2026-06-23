require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT;

let sequelize;

async function initializeDatabase() {
  try {
    // 1. Ensure database exists
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      ssl: { rejectUnauthorized: false } // Accept Aiven self-signed SSL certs
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();
    console.log(`Database "${DB_NAME}" checked/created successfully.`);

    // 2. Initialize Sequelize
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: { rejectUnauthorized: false }
      },
      define: {
        timestamps: true,
        underscored: true,
      }
    });

    await sequelize.authenticate();
    console.log('Sequelize database connection established successfully.');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getSequelize: () => sequelize,
};
