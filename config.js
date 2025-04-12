require('dotenv').config();

module.exports = {
  PORT: 5000,
  HOST:  'localhost',
  DB: {
    database: 'photobooth_db',
    username: 'postgres',
    password: 'alejandrotal',
    host: 'localhost',
    port: '5432',
    dialect: 'postgres',
  },
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads/',
  JWT_SECRET: process.env.JWT_SECRET,
};
