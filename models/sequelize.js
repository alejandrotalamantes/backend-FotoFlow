// backend/models/sequelize.js
const { Sequelize } = require('sequelize');
const { DB } = require('../config');

const sequelize = new Sequelize(DB.database, DB.username, DB.password, {
  host: DB.host,
  dialect: DB.dialect,
});

module.exports = sequelize;