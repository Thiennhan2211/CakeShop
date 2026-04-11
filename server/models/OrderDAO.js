require('../utils/MongooseUtil');
const Models = require('./Models');
const mongoose = require('mongoose');

const buildCustomerQuery = (_cid) => {
  return mongoose.Types.ObjectId.isValid(_cid)
    ? {
        $or: [
          { 'customer._id': _cid },
          { 'customer._id': new mongoose.Types.ObjectId(_cid) }
        ]
      }
    : { 'customer._id': _cid };
};

const buildOrderSummary = (order = {}) => {
  const items = Array.isArray(order.items) ? order.items : [];

  return {
    _id: order._id,
    cdate: order.cdate,
    subtotal: Number(order.subtotal) || 0,
    shippingFee: Number(order.shippingFee) || 0,
    discountAmount: Number(order.discountAmount) || 0,
    total: Number(order.total) || 0,
    status: order.status || '',
    paymentMethod: order.paymentMethod || 'COD',
    customer: order.customer || {},
    voucher: order.voucher || null,
    itemCount: items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
  };
};

const OrderDAO = {
  async insert(order) {
    order._id = new mongoose.Types.ObjectId();
    const result = await Models.Order.create(order);
    return result;
  },
  async selectByCustID(_cid) {
    const orders = await Models.Order.find(buildCustomerQuery(_cid)).sort({ cdate: -1 }).lean().exec();
    return orders;
  },
  async selectByCustIDSummary(_cid) {
    const orders = await Models.Order.find(
      buildCustomerQuery(_cid),
      {
        _id: 1,
        cdate: 1,
        subtotal: 1,
        shippingFee: 1,
        discountAmount: 1,
        total: 1,
        status: 1,
        paymentMethod: 1,
        'customer._id': 1,
        'customer.name': 1,
        'customer.phone': 1,
        'voucher.code': 1,
        'items.quantity': 1
      }
    ).sort({ cdate: -1 }).lean().exec();

    return orders.map((order) => buildOrderSummary(order));
  },
  async selectAll() {
    const query = {};
    const mysort = { cdate: -1 }; // descending
    const orders = await Models.Order.find(query).sort(mysort).lean().exec();
    return orders;
  },
  async selectAllSummary() {
    const orders = await Models.Order.find(
      {},
      {
        _id: 1,
        cdate: 1,
        subtotal: 1,
        shippingFee: 1,
        discountAmount: 1,
        total: 1,
        status: 1,
        paymentMethod: 1,
        'customer._id': 1,
        'customer.name': 1,
        'customer.phone': 1,
        'voucher.code': 1,
        'items.quantity': 1
      }
    ).sort({ cdate: -1 }).lean().exec();

    return orders.map((order) => buildOrderSummary(order));
  },
  async selectByID(_id) {
    return Models.Order.findById(_id).lean().exec();
  },
  async update(_id, newStatus) {
    const newvalues = { status: newStatus };
    const result = await Models.Order.findByIdAndUpdate(_id, newvalues, { new: true });
    return result;
  },
  async selectUsedVoucherCodesByCustID(_cid) {
    const orders = await Models.Order.find(
      buildCustomerQuery(_cid),
      { 'voucher.code': 1 }
    ).lean().exec();
    return [...new Set(
      orders
        .map((order) => (order.voucher?.code || '').toString().trim().toUpperCase())
        .filter(Boolean)
    )];
  },
  async hasCustomerUsedVoucher(_cid, voucherCode) {
    const normalizedCode = (voucherCode || '').toString().trim().toUpperCase();
    if (!normalizedCode) {
      return false;
    }

    const usedVoucherCodes = await this.selectUsedVoucherCodesByCustID(_cid);
    return usedVoucherCodes.includes(normalizedCode);
  }
};

module.exports = OrderDAO;
