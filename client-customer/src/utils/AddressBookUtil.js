const emptyAddressForm = {
  _id: '',
  firstName: '',
  lastName: '',
  company: '',
  addressLine1: '',
  province: '',
  district: '',
  ward: '',
  phone: '',
  isDefault: false
};

const normalizeText = (value) => {
  return (value || '').toString().trim();
};

const normalizeId = (value) => {
  return value ? value.toString().trim() : '';
};

const normalizeAddressList = (addresses = []) => {
  if (!Array.isArray(addresses)) {
    return [];
  }

  let hasDefault = false;
  const nextAddresses = addresses.map((address, index) => {
    const nextAddress = {
      ...emptyAddressForm,
      ...address,
      _id: normalizeId(address?._id),
      firstName: normalizeText(address?.firstName),
      lastName: normalizeText(address?.lastName),
      company: normalizeText(address?.company),
      addressLine1: normalizeText(address?.addressLine1),
      province: normalizeText(address?.province),
      district: normalizeText(address?.district),
      ward: normalizeText(address?.ward),
      phone: normalizeText(address?.phone),
      isDefault: Boolean(address?.isDefault)
    };

    if (nextAddress.isDefault && !hasDefault) {
      hasDefault = true;
      return nextAddress;
    }

    nextAddress.isDefault = false;
    if (!hasDefault && index === 0) {
      nextAddress.isDefault = true;
      hasDefault = true;
    }

    return nextAddress;
  });

  return nextAddresses.sort((firstAddress, secondAddress) => {
    return Number(Boolean(secondAddress.isDefault)) - Number(Boolean(firstAddress.isDefault));
  });
};

const toComparableAddress = (address = {}) => {
  const normalized = {
    ...emptyAddressForm,
    ...address
  };

  return {
    firstName: normalizeText(normalized.firstName),
    lastName: normalizeText(normalized.lastName),
    company: normalizeText(normalized.company),
    addressLine1: normalizeText(normalized.addressLine1),
    province: normalizeText(normalized.province),
    district: normalizeText(normalized.district),
    ward: normalizeText(normalized.ward),
    phone: normalizeText(normalized.phone),
    isDefault: Boolean(normalized.isDefault)
  };
};

const AddressBookUtil = {
  createEmptyForm() {
    return { ...emptyAddressForm };
  },

  getDefaultAddress(addresses = []) {
    return normalizeAddressList(addresses)[0] || null;
  },

  normalizeAddressList,

  areSameAddressBooks(firstAddresses = [], secondAddresses = []) {
    const first = normalizeAddressList(firstAddresses).map((address) => toComparableAddress(address));
    const second = normalizeAddressList(secondAddresses).map((address) => toComparableAddress(address));
    return JSON.stringify(first) === JSON.stringify(second);
  },

  fromAddress(address = {}) {
    return {
      ...emptyAddressForm,
      ...address,
      _id: normalizeId(address?._id),
      firstName: normalizeText(address?.firstName),
      lastName: normalizeText(address?.lastName),
      company: normalizeText(address?.company),
      addressLine1: normalizeText(address?.addressLine1),
      province: normalizeText(address?.province),
      district: normalizeText(address?.district),
      ward: normalizeText(address?.ward),
      phone: normalizeText(address?.phone),
      isDefault: Boolean(address?.isDefault)
    };
  },

  toPayload(address = {}, customer = {}) {
    return {
      _id: normalizeId(address._id) || undefined,
      firstName: normalizeText(address.firstName),
      lastName: normalizeText(address.lastName),
      company: normalizeText(address.company),
      addressLine1: normalizeText(address.addressLine1),
      province: normalizeText(address.province),
      district: normalizeText(address.district),
      ward: normalizeText(address.ward),
      phone: normalizeText(address.phone),
      email: normalizeText(customer?.email),
      isDefault: Boolean(address.isDefault)
    };
  },

  validate(address = {}) {
    if (!normalizeText(address.firstName)) {
      return 'Vui lòng nhập tên người nhận.';
    }

    if (!normalizeText(address.lastName)) {
      return 'Vui lòng nhập họ người nhận.';
    }

    if (!normalizeText(address.addressLine1)) {
      return 'Vui lòng nhập địa chỉ chi tiết.';
    }

    if (!normalizeText(address.province)) {
      return 'Vui lòng nhập tỉnh hoặc thành phố.';
    }

    if (!normalizeText(address.district)) {
      return 'Vui lòng nhập quận hoặc huyện.';
    }

    if (!normalizeText(address.ward)) {
      return 'Vui lòng nhập phường hoặc xã.';
    }

    if (!normalizeText(address.phone)) {
      return 'Vui lòng nhập số điện thoại nhận hàng.';
    }

    return '';
  },

  buildFullName(address = {}, customer = {}) {
    const fullName = [normalizeText(address.lastName), normalizeText(address.firstName)]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || normalizeText(customer?.name);
  },

  buildAddressText(address = {}) {
    return [
      normalizeText(address.addressLine1),
      normalizeText(address.ward),
      normalizeText(address.district),
      normalizeText(address.province)
    ]
      .filter(Boolean)
      .join(', ');
  },

  toDeliveryInfo(address = {}, customer = {}) {
    return {
      fullName: this.buildFullName(address, customer),
      phone: normalizeText(address.phone) || normalizeText(customer?.phone),
      email: normalizeText(customer?.email),
      address: this.buildAddressText(address),
      note: ''
    };
  },

  makeDefault(addresses = [], addressId = '') {
    return normalizeAddressList(
      addresses.map((address) => ({
        ...address,
        isDefault: String(address?._id || '') === String(addressId || '')
      }))
    );
  }
};

export default AddressBookUtil;
