require('../utils/MongooseUtil');
const mongoose = require('mongoose');
const Models = require('./Models');

const normalizeVoucher = (voucher) => {
  if (!voucher) {
    return null;
  }

  const normalized = voucher.toObject ? voucher.toObject() : { ...voucher };
  normalized.code = (normalized.code || '').toString().trim().toUpperCase();
  normalized.title = (normalized.title || '').toString().trim();
  normalized.description = (normalized.description || '').toString().trim();
  normalized.discount = Number(normalized.discount) || 0;
  normalized.minOrder = Number(normalized.minOrder) || 0;
  normalized.type = normalized.type === 'freeship' ? 'freeship' : 'discount';
  normalized.active = Number(normalized.active ?? 1) === 0 ? 0 : 1;
  return normalized;
};

const buildVoucherPayload = (voucher) => {
  const normalized = normalizeVoucher(voucher);
  return {
    code: normalized.code,
    title: normalized.title,
    discount: normalized.discount,
    minOrder: normalized.minOrder,
    description: normalized.description,
    type: normalized.type,
    active: normalized.active,
    cdate: normalized.cdate || new Date().getTime()
  };
};

const VoucherDAO = {
  async selectAll() {
    const vouchers = await Models.Voucher.find({}).sort({ cdate: -1 }).lean().exec();
    return vouchers.map((voucher) => normalizeVoucher(voucher));
  },
  async selectActive() {
    const vouchers = await Models.Voucher.find({ active: { $ne: 0 } }).sort({ cdate: -1 }).lean().exec();
    return vouchers.map((voucher) => normalizeVoucher(voucher));
  },
  async selectByCode(code) {
    const voucher = await Models.Voucher.findOne({ code: (code || '').toString().trim().toUpperCase() }).lean().exec();
    return normalizeVoucher(voucher);
  },
  async insert(voucher) {
    const payload = buildVoucherPayload(voucher);
    payload._id = new mongoose.Types.ObjectId();
    const createdVoucher = await Models.Voucher.create(payload);
    return normalizeVoucher(createdVoucher);
  },
  async update(id, voucher) {
    const payload = buildVoucherPayload(voucher);
    await Models.Voucher.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: payload }
    );
    const updated = await Models.Voucher.findById(id).exec();
    return normalizeVoucher(updated);
  },
  async delete(id) {
    return Models.Voucher.findByIdAndDelete(id).exec();
  }
};

module.exports = VoucherDAO;
