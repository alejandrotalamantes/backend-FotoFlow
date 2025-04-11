require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || 'localhost',
  DB: {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  },
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads/',
  JWT_SECRET: process.env.JWT_SECRET,
};
