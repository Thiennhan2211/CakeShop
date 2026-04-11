require('dotenv').config();

const MyConstants = {
  DB_SERVER: process.env.DB_SERVER,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_DATABASE: process.env.DB_DATABASE,

  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  CLIENT_CUSTOMER_URL: process.env.CLIENT_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES: '1h'
};

module.exports = MyConstants;