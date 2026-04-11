const mongoose = require('mongoose');

// schemas
const AdminSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: String,
  password: String
}, { versionKey: false });

const CategorySchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String
}, { versionKey: false });

const CustomerAddressSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  addressLine1: {
    type: String,
    default: ''
  },
  ward: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: ''
  },
  province: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  cdate: {
    type: Number,
    default: () => new Date().getTime()
  }
}, { versionKey: false });

const CustomerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  active: Number,
  token: String,
  addresses: {
    type: [CustomerAddressSchema],
    default: []
  }
}, { versionKey: false });
CustomerSchema.index({ username: 1 });
CustomerSchema.index({ email: 1 });

// Tìm đến ProductSchema trong Models.js
const ProductSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  slug: {
    type: String,
    default: ''
  },
  price: Number,
  image: String,
  cdate: Number,
  category: {
    _id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  sizes: {
    type: [String],
    default: []
  }
}, { versionKey: false });
ProductSchema.index({ cdate: -1 });
ProductSchema.index({ 'category._id': 1 });
ProductSchema.index({ name: 1 });

const ItemSchema = mongoose.Schema({
  product: ProductSchema,
  quantity: Number,
  size: String,
  note: {
    type: String,
    default: ''
  }
}, { versionKey: false, _id: false });

const OrderSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  cdate: Number,
  subtotal: {
    type: Number,
    default: 0
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  total: Number,
  status: String,
  paymentMethod: {
    type: String,
    default: 'COD'
  },
  customer: CustomerSchema,
  deliveryInfo: {
    type: Object,
    default: null
  },
  voucher: {
    type: Object,
    default: null
  },
  items: [ItemSchema]
}, { versionKey: false });
OrderSchema.index({ cdate: -1 });
OrderSchema.index({ status: 1, cdate: -1 });
OrderSchema.index({ 'customer._id': 1, cdate: -1 });
OrderSchema.index({ 'voucher.code': 1 });

const VoucherSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  code: String,
  title: String,
  discount: {
    type: Number,
    default: 0
  },
  minOrder: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'discount'
  },
  active: {
    type: Number,
    default: 1
  },
  cdate: Number
}, { versionKey: false, collection: 'vouchers' });
VoucherSchema.index({ code: 1 });
VoucherSchema.index({ active: 1, cdate: -1 });

// models
const Admin = mongoose.model('Admin', AdminSchema);
const Category = mongoose.model('Category', CategorySchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Voucher = mongoose.models.Voucher || mongoose.model('Voucher', VoucherSchema);

module.exports = { Admin, Category, Customer, Product, Order, Voucher };
