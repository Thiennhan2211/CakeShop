const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('./utils/MongooseUtil');
const ProductDAO = require('./models/ProductDAO');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use('/api/admin', require('./api/admin'));
app.use('/api/customer', require('./api/customer'));

mongoose.connection.once('open', async () => {
  console.log(' DB name:', mongoose.connection.name);
  await ProductDAO.ensureSizeFieldExists();

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(' Collections:', collections.map(c => c.name));
});

// test API
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

// test DB
app.get('/categories', async (req, res) => {
  const categories = await mongoose.connection
    .collection('categories')
    .find({})
    .toArray();
  res.json(categories);
});
// 1. Phục vụ giao diện ADMIN khi truy cập /admin
// Thay 'build' bằng 'dist' nếu bạn dùng Vite
app.use('/admin', express.static(path.join(__dirname, '../client-admin/build')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client-admin/build', 'index.html'));
});

// 2. Phục vụ giao diện CUSTOMER cho trang chủ và các đường dẫn còn lại
app.use(express.static(path.join(__dirname, '../client-customer/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client-customer/build', 'index.html'));
});
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
