const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const AdminDAO = require('../models/AdminDAO');
const ProductDAO = require('../models/ProductDAO');
const CategoryDAO = require('../models/CategoryDAO');
const OrderDAO = require('../models/OrderDAO');
const CustomerDAO = require('../models/CustomerDAO');
const VoucherDAO = require('../models/VoucherDAO');
const EmailUtil = require('../utils/EmailUtil');

const normalizeSizes = (sizes = []) => {
  if (!Array.isArray(sizes)) {
    return [];
  }

  return [...new Set(sizes.filter(Boolean).map((size) => size.toString().trim().toUpperCase()))];
};

const buildCategorySnapshot = (category) => {
  if (!category) {
    return null;
  }

  return { _id: category._id, name: category.name };
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: 'Missing info' });

  const admin = await AdminDAO.selectByUsernameAndPassword(username, password);
  if (admin) {
    const token = JwtUtil.genToken(username, password);
    res.json({ success: true, token });
  } else {
    res.json({ success: false, message: 'Incorrect login' });
  }
});

router.get('/token', JwtUtil.checkToken, (req, res) => {
  res.json({ success: true, message: 'Token valid' });
});
router.get('/products', JwtUtil.checkToken, async function (req, res) {
  const sizePage = 4;
  let curPage = 1;
  if (req.query.page) {
    curPage = parseInt(req.query.page); // /products?page=xxx
  }
  const result = await ProductDAO.selectPage(curPage, sizePage);
  res.json(result);
});
router.post('/products', JwtUtil.checkToken, async function (req, res) {
  const name = req.body.name;
  const price = req.body.price;
  const cid = req.body.category;
  const image = req.body.image;
  const normalizedSizes = normalizeSizes(req.body.sizes);
  const sizes = req.body.sizes; // <--- THÊM DÒNG NÀY ĐỂ LẤY SIZES TỪ REACT GỬI LÊN
  const now = new Date().getTime();
  const category = await CategoryDAO.selectByID(cid);
  const categorySnapshot = buildCategorySnapshot(category);
  
  // ---> THÊM sizes: sizes VÀO TRONG OBJECT NÀY
  const product = { name: name, price: price, image: image, cdate: now, category: categorySnapshot, sizes: normalizedSizes };
  
  const result = await ProductDAO.insert(product);
  res.json(result);
});
router.put('/products', JwtUtil.checkToken, async function (req, res) {
  const _id = req.body.id;
  const name = req.body.name;
  const price = req.body.price;
  const cid = req.body.category;
  const image = req.body.image;
  const normalizedSizes = normalizeSizes(req.body.sizes);

  const now = new Date().getTime(); // milliseconds

  const category = await CategoryDAO.selectByID(cid);
  const categorySnapshot = buildCategorySnapshot(category);

  const product = {
    _id: _id,
    name: name,
    price: price,
    image: image,
    cdate: now,
    category: categorySnapshot,
    sizes: normalizedSizes
  };

  const result = await ProductDAO.update(product);
  res.json(result);
});
router.put('/products/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const name = req.body.name;
  const price = req.body.price;
  const cid = req.body.category;
  const image = req.body.image;
  const sizes = normalizeSizes(req.body.sizes);
  const now = new Date().getTime();
  const category = await CategoryDAO.selectByID(cid);
  const categorySnapshot = buildCategorySnapshot(category);
  
  const product = { _id: _id, name: name, price: price, image: image, cdate: now, category: categorySnapshot, sizes: sizes };
  
  const result = await ProductDAO.update(product);
  res.json(result);
});
router.delete('/products/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const result = await ProductDAO.delete(_id);
  res.json(result);
});

router.get('/categories', JwtUtil.checkToken, async function (req, res) {
  try {
    const categories = await CategoryDAO.selectAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});
router.post('/categories', JwtUtil.checkToken, async function (req, res) {
  const name = req.body.name;
  const category = { name: name };
  const result = await CategoryDAO.insert(category);
  res.json(result);
});
router.put('/categories/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const name = req.body.name;

  const category = { _id: _id, name: name };
  const result = await CategoryDAO.update(category);

  res.json(result);
});
router.delete('/categories/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const result = await CategoryDAO.delete(_id);
  res.json(result);
});
router.get('/orders', JwtUtil.checkToken, async function(req, res) {
    const orders = await OrderDAO.selectAll();
    res.json(orders);
});
router.get('/orders/summary', JwtUtil.checkToken, async function(req, res) {
    const orders = await OrderDAO.selectAllSummary();
    res.json(orders);
});
router.get('/orders/:id', JwtUtil.checkToken, async function(req, res) {
    const order = await OrderDAO.selectByID(req.params.id);
    res.json(order);
});
router.put('/orders/status/:id', JwtUtil.checkToken, async function(req, res) {
    const _id = req.params.id;
    const newStatus = req.body.status;
    const result = await OrderDAO.update(_id, newStatus);
    res.json(result);
});
// customer
router.get('/customers', JwtUtil.checkToken, async function (req, res) {
    const customers = await CustomerDAO.selectAll();
    res.json(customers);
});

// order
router.get('/orders/customer/:cid/summary', JwtUtil.checkToken, async function (req, res) {
    const orders = await OrderDAO.selectByCustIDSummary(req.params.cid);
    res.json(orders);
});
router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
    const _cid = req.params.cid;
    const orders = await OrderDAO.selectByCustID(_cid);
    res.json(orders);
});
router.put('/customers/deactive/:id', JwtUtil.checkToken, async function (req, res) {
    const _id = req.params.id;
    const token = req.body.token;
    const result = await CustomerDAO.active(_id, token, 0);
    res.json(result);
});
router.get('/customers/sendmail/:id', JwtUtil.checkToken, async function (req, res) {
    const _id = req.params.id;
    const cust = await CustomerDAO.selectByID(_id);

    if (cust) {
        const send = await EmailUtil.send(cust.email, cust._id, cust.token);

        if (send) {
            res.json({ success: true, message: 'Please check email' });
        } else {
            res.json({ success: false, message: 'Email failure' });
        }
    } else {
        res.json({ success: false, message: 'Not exists customer' });
    }
});
router.get('/customers/:id', JwtUtil.checkToken, async function (req, res) {
  const customer = await CustomerDAO.selectByID(req.params.id);
  res.json(customer);
});

router.get('/vouchers', JwtUtil.checkToken, async function (req, res) {
  const vouchers = await VoucherDAO.selectAll();
  res.json(vouchers);
});

router.post('/vouchers', JwtUtil.checkToken, async function (req, res) {
  const voucher = {
    code: (req.body.code || '').toString().trim().toUpperCase(),
    title: (req.body.title || '').toString().trim(),
    discount: Number(req.body.discount) || 0,
    minOrder: Number(req.body.minOrder) || 0,
    description: (req.body.description || '').toString().trim(),
    type: req.body.type === 'freeship' ? 'freeship' : 'discount',
    active: Number(req.body.active ?? 1) === 0 ? 0 : 1
  };

  if (!voucher.code || !voucher.title) {
    res.json({ success: false, message: 'Thiếu mã hoặc tiêu đề voucher.' });
    return;
  }

  const exists = await VoucherDAO.selectByCode(voucher.code);
  if (exists) {
    res.json({ success: false, message: 'Mã voucher đã tồn tại.' });
    return;
  }

  const result = await VoucherDAO.insert(voucher);
  res.json({ success: Boolean(result), voucher: result });
});

router.put('/vouchers/:id', JwtUtil.checkToken, async function (req, res) {
  const result = await VoucherDAO.update(req.params.id, {
    code: (req.body.code || '').toString().trim().toUpperCase(),
    title: (req.body.title || '').toString().trim(),
    discount: Number(req.body.discount) || 0,
    minOrder: Number(req.body.minOrder) || 0,
    description: (req.body.description || '').toString().trim(),
    type: req.body.type === 'freeship' ? 'freeship' : 'discount',
    active: Number(req.body.active ?? 1) === 0 ? 0 : 1
  });

  res.json({ success: Boolean(result), voucher: result });
});

router.delete('/vouchers/:id', JwtUtil.checkToken, async function (req, res) {
  const result = await VoucherDAO.delete(req.params.id);
  res.json({ success: Boolean(result) });
});
module.exports = router;
