require('../utils/MongooseUtil');
const Models = require('./Models');
const mongoose = require('mongoose');

const buildCustomerId = (_id) => {
  return mongoose.Types.ObjectId.isValid(_id)
    ? new mongoose.Types.ObjectId(_id)
    : _id;
};

const publicCustomerProjection = {
  password: 0,
  token: 0
};

const normalizeAddress = (address = {}) => {
  const safeId = mongoose.Types.ObjectId.isValid(address?._id)
    ? new mongoose.Types.ObjectId(address._id)
    : new mongoose.Types.ObjectId();

  return {
    _id: safeId,
    firstName: (address.firstName || '').toString().trim(),
    lastName: (address.lastName || '').toString().trim(),
    company: (address.company || '').toString().trim(),
    addressLine1: (address.addressLine1 || '').toString().trim(),
    ward: (address.ward || '').toString().trim(),
    district: (address.district || '').toString().trim(),
    province: (address.province || '').toString().trim(),
    phone: (address.phone || '').toString().trim(),
    email: (address.email || '').toString().trim(),
    isDefault: Boolean(address.isDefault),
    cdate: Number(address.cdate) || new Date().getTime()
  };
};

const normalizeAddresses = (addresses = []) => {
  if (!Array.isArray(addresses)) {
    return [];
  }

  const normalized = addresses
    .map((address) => normalizeAddress(address))
    .filter((address) => {
      return Boolean(
        address.firstName ||
        address.lastName ||
        address.company ||
        address.addressLine1 ||
        address.ward ||
        address.district ||
        address.province ||
        address.phone ||
        address.email
      );
    });

  let foundDefault = false;
  const nextAddresses = normalized.map((address, index) => {
    const nextAddress = { ...address };

    if (nextAddress.isDefault && !foundDefault) {
      foundDefault = true;
      return nextAddress;
    }

    nextAddress.isDefault = false;
    if (!foundDefault && index === 0) {
      nextAddress.isDefault = true;
      foundDefault = true;
    }

    return nextAddress;
  });

  return nextAddresses;
};

const CustomerDAO = {
  async selectByUsernameOrEmail(username, email) {
    const query = { $or: [{ username: username }, { email: email }] };
    const customer = await Models.Customer.findOne(query).lean().exec();
    return customer;
  },

  async insert(customer) {
    customer._id = new mongoose.Types.ObjectId();
    const result = await Models.Customer.create(customer);
    return result;
  },
  async active(_id, token, active) {
    const query = { _id: _id, token: token };
    const newvalues = { $set: { active: active } };
    const result = await Models.Customer.findOneAndUpdate(query, newvalues, { new: true });
    return result;
  },
  async selectByUsernameAndPassword(username, password) {
    const query = { username: username, password: password };
    const customer = await Models.Customer.findOne(query).lean().exec();
    return customer;
  },
  async update(customer) {
        const newvalues = { 
            username: customer.username, 
            password: customer.password, 
            name: customer.name, 
            phone: customer.phone, 
            email: customer.email 
        };
        const result = await Models.Customer.findByIdAndUpdate(customer._id, newvalues, { new: true });
        return result;
    },
    async selectAll() {
        const query = {};
        const customers = await Models.Customer.find(query, {
          ...publicCustomerProjection,
          addresses: 0
        }).lean().exec();
        return customers;
    },
    async selectByID(_id) {
    const customer = await Models.Customer.findById(_id, publicCustomerProjection).lean().exec();
    return customer;
    },
    async updateAddresses(_id, addresses) {
      const customerId = buildCustomerId(_id);
      const result = await Models.Customer.findByIdAndUpdate(
        customerId,
        { $set: { addresses: normalizeAddresses(addresses) } },
        {
          projection: publicCustomerProjection,
          returnDocument: 'after',
          runValidators: true
        }
      ).lean().exec();

      return result;
    }
};

module.exports = CustomerDAO;
