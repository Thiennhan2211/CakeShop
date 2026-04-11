const express = require('express');
const router = express.Router();
const CryptoUtil = require('../utils/CryptoUtil');
const EmailUtil = require('../utils/EmailUtil');
const CategoryDAO = require('../models/CategoryDAO');
const ProductDAO  = require('../models/ProductDAO');
const CustomerDAO = require('../models/CustomerDAO');
const JwtUtil = require('../utils/JwtUtil');
const OrderDAO = require('../models/OrderDAO');
const VoucherDAO = require('../models/VoucherDAO');

const DEFAULT_SHIPPING_FEE = 30000;

const toNumber = (value) => {
  return Number(value) || 0;
};

const buildCustomerSnapshot = (customer = {}) => {
  return {
    _id: customer._id,
    username: customer.username,
    name: customer.name,
    phone: customer.phone,
    email: customer.email
  };
};

const sanitizeOrderItems = (items = []) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && item.product && item.product._id)
    .map((item) => ({
      product: item.product,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      size: (item.size || '').toString().trim().toUpperCase(),
      note: (item.note || '').toString().trim()
    }));
};

const calculateSubtotal = (items = []) => {
  return items.reduce((sum, item) => {
    return sum + (toNumber(item.product?.price) * toNumber(item.quantity));
  }, 0);
};

const buildAddressFullName = (address = {}, customer = {}) => {
  const savedFullName = [address.lastName, address.firstName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return savedFullName || (customer.name || '').toString().trim();
};

const buildAddressText = (address = {}) => {
  return [
    address.addressLine1,
    address.ward,
    address.district,
    address.province
  ]
    .filter(Boolean)
    .map((value) => value.toString().trim())
    .filter(Boolean)
    .join(', ');
};

const pickPreferredAddress = (customer = {}, selectedAddressId = '') => {
  const addresses = Array.isArray(customer?.addresses) ? customer.addresses : [];
  if (addresses.length === 0) {
    return null;
  }

  const normalizedSelectedId = (selectedAddressId || '').toString().trim();
  if (normalizedSelectedId) {
    const matchedAddress = addresses.find((address) => {
      return String(address?._id || '') === normalizedSelectedId;
    });

    if (matchedAddress) {
      return matchedAddress;
    }
  }

  return addresses.find((address) => Boolean(address?.isDefault)) || addresses[0] || null;
};

const normalizeDeliveryInfo = (deliveryInfo = {}, customer = {}, savedAddress = null) => {
  return {
    fullName: (deliveryInfo.fullName || buildAddressFullName(savedAddress, customer) || customer.name || '').toString().trim(),
    phone: (deliveryInfo.phone || savedAddress?.phone || customer.phone || '').toString().trim(),
    email: (deliveryInfo.email || savedAddress?.email || customer.email || '').toString().trim(),
    address: (deliveryInfo.address || buildAddressText(savedAddress) || '').toString().trim(),
    note: (deliveryInfo.note || '').toString().trim()
  };
};

const validateVoucher = async (voucherData, subtotal) => {
  const voucherCode = (voucherData?.code || voucherData || '').toString().trim().toUpperCase();
  if (!voucherCode) {
    return {
      voucher: null,
      shippingFee: DEFAULT_SHIPPING_FEE,
      discountAmount: 0
    };
  }

  const voucher = await VoucherDAO.selectByCode(voucherCode);
  if (!voucher || voucher.active === 0 || subtotal < voucher.minOrder) {
    return null;
  }

  if (voucher.type === 'freeship') {
    return {
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        title: voucher.title,
        discount: voucher.discount,
        minOrder: voucher.minOrder,
        type: voucher.type
      },
      shippingFee: 0,
      discountAmount: 0
    };
  }

  return {
    voucher: {
      _id: voucher._id,
      code: voucher.code,
      title: voucher.title,
      discount: voucher.discount,
      minOrder: voucher.minOrder,
      type: voucher.type
    },
    shippingFee: DEFAULT_SHIPPING_FEE,
    discountAmount: Math.min(subtotal, voucher.discount)
  };
};
router.get('/categories', async function (req, res) {
  const categories = await CategoryDAO.selectAll();
  res.json(categories);
});


router.get('/products/new', async function (req, res) {
  const products = await ProductDAO.selectTopNew(3);
  res.json(products);
});

router.get('/products/hot', async function (req, res) {
  const products = await ProductDAO.selectTopHot(3);
  res.json(products);
});
router.get('/products/category/:cid', async function (req, res) {
  const _cid = req.params.cid;
  const products = await ProductDAO.selectByCatID(_cid);
  res.json(products);
});
router.get('/products/search/:keyword', async function (req, res) {
  const keyword = req.params.keyword;
  const products = await ProductDAO.selectByKeyword(keyword);
  res.json(products);
});
router.get('/products/:id', async function (req, res) {
  const _id = req.params.id;
  const product = await ProductDAO.selectByID(_id);
  res.json(product);
});
router.get('/products/slug/:slug', async function (req, res) {
  const product = await ProductDAO.selectBySlug(req.params.slug);
  res.json(product);
});
router.get('/vouchers', async function (req, res) {
  const vouchers = await VoucherDAO.selectActive();
  res.json(vouchers);
});
router.get('/vouchers/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  const vouchers = await VoucherDAO.selectActive();
  const usedVoucherCodes = await OrderDAO.selectUsedVoucherCodesByCustID(req.params.cid);
  const availableVouchers = vouchers.filter((voucher) => {
    return !usedVoucherCodes.includes((voucher.code || '').toString().trim().toUpperCase());
  });
  res.json(availableVouchers);
});
router.post('/signup', async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;

  const dbCust = await CustomerDAO.selectByUsernameOrEmail(username, email);

  if (dbCust) {
    res.json({ success: false, message: 'Exists username or email' });
  } else {
    const now = new Date().getTime(); // milliseconds
    const token = CryptoUtil.md5(now.toString());

    const newCust = {
      username: username,
      password: password,
      name: name,
      phone: phone,
      email: email,
      active: 0,
      token: token
    };

    const result = await CustomerDAO.insert(newCust);

    if (result) {
      const send = await EmailUtil.send(email, result._id, token);

      if (send) {
        res.json({ success: true, message: 'Please check email' });
      } else {
        res.json({ success: false, message: 'Email failure' });
      }

    } else {
      res.json({ success: false, message: 'Insert failure' });
    }
  }
});
router.post('/active', async function (req, res) {
  const _id = req.body.id;
  const token = req.body.token;
  const result = await CustomerDAO.active(_id, token, 1);
  res.json(result);
});
router.post('/login', async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
    const customer = await CustomerDAO.selectByUsernameAndPassword(username, password);
    if (customer) {
      if (customer.active === 1) {
        const token = JwtUtil.genToken();
        res.json({ success: true, message: 'Authentication successful', token: token, customer: customer });
      } else {
        res.json({ success: false, message: 'Account is deactive' });
      }
    } else {
      res.json({ success: false, message: 'Incorrect username or password' });
    }
  } else {
    res.json({ success: false, message: 'Please input username and password' });
  }
});

router.get('/token', JwtUtil.checkToken, function (req, res) {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  res.json({ success: true, message: 'Token is valid', token: token });
});
router.put('/customers/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;

  const customer = { _id: _id, username: username, password: password, name: name, phone: phone, email: email };
  const result = await CustomerDAO.update(customer);
  res.json(result);
});
router.get('/addresses/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  try {
    const customer = await CustomerDAO.selectByID(req.params.cid);
    res.json(customer?.addresses || []);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Không thể tải sổ địa chỉ lúc này.' });
  }
});
router.put('/addresses/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  try {
  const nextAddresses = Array.isArray(req.body.addresses) ? req.body.addresses : [];
  const result = await CustomerDAO.updateAddresses(req.params.cid, nextAddresses);

  if (!result) {
    res.json({ success: false, message: 'Không thể cập nhật sổ địa chỉ.' });
    return;
  }

  res.json({
    success: true,
    customer: result,
    addresses: result.addresses || []
  });
  } catch (error) {
    console.error('Address book update failed:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật sổ địa chỉ.',
      error: error.message
    });
  }
});
// mycart
router.post('/checkout', JwtUtil.checkToken, async function (req, res) {
  const now = new Date().getTime(); // milliseconds
  const items = sanitizeOrderItems(req.body.items);
  const customer = buildCustomerSnapshot(req.body.customer);
  const customerRecord = customer?._id ? await CustomerDAO.selectByID(customer._id) : null;
  const paymentMethod = (req.body.paymentMethod || 'COD').toString().trim().toUpperCase();
  const isCodPayment = paymentMethod === 'COD';
  const subtotal = calculateSubtotal(items);
  const voucherResult = await validateVoucher(req.body.voucher, subtotal);

  if (items.length === 0) {
    res.json({ success: false, message: 'Giỏ hàng của bạn đang trống.' });
    return;
  }

  if (req.body.voucher && !voucherResult) {
    res.json({ success: false, message: 'Coupon không hợp lệ hoặc chưa đạt giá trị tối thiểu!' });
    return;
  }

  if (voucherResult?.voucher?.code && customer?._id) {
    const hasUsedVoucher = await OrderDAO.hasCustomerUsedVoucher(customer._id, voucherResult.voucher.code);
    if (hasUsedVoucher) {
      res.json({ success: false, message: 'Voucher này đã được tài khoản của bạn sử dụng.' });
      return;
    }
  }

  const shippingFee = isCodPayment
    ? (voucherResult ? voucherResult.shippingFee : DEFAULT_SHIPPING_FEE)
    : 0;
  const discountAmount = isCodPayment
    ? (voucherResult ? voucherResult.discountAmount : 0)
    : 0;
  const total = isCodPayment ? subtotal + shippingFee - discountAmount : 0;
  const deliveryInfo = normalizeDeliveryInfo(
    req.body.deliveryInfo,
    customerRecord || customer,
    pickPreferredAddress(customerRecord, req.body.selectedAddressId)
  );

  if (!deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address) {
    res.json({ success: false, message: 'Vui lòng chọn hoặc nhập đầy đủ thông tin giao hàng.' });
    return;
  }

  const order = {
    cdate: now,
    subtotal: isCodPayment ? subtotal : 0,
    shippingFee: shippingFee,
    discountAmount: discountAmount,
    total: total,
    status: 'PENDING',
    paymentMethod: paymentMethod,
    customer: customer,
    deliveryInfo: deliveryInfo,
    voucher: voucherResult ? voucherResult.voucher : null,
    items: items
  };

  const result = await OrderDAO.insert(order);
  res.json({
    success: Boolean(result),
    order: result,
    deferredPayment: !isCodPayment,
    message: isCodPayment
      ? 'Đặt hàng thành công.'
      : 'Phương thức thanh toán đang cập nhật. Cake House đã ghi nhận đơn hàng của bạn.'
  });
});
router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  const _cid = req.params.cid;
  const orders = await OrderDAO.selectByCustIDSummary(_cid);
  res.json(orders);
});
module.exports = router;
