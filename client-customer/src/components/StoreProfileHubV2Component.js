import axios from 'axios';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import AddressBookUtil from '../utils/AddressBookUtil';
import PageIntro from './PageIntroComponent';
import StorefrontHelper from '../utils/StorefrontHelper';

const sectionMeta = {
  account: { title: 'Thông tin tài khoản', badge: 'Tài khoản' },
  orders: { title: 'Đơn hàng', badge: 'Đơn hàng' },
  address: { title: 'Địa chỉ', badge: 'Địa chỉ' },
  vouchers: { title: 'Voucher của tôi', badge: 'Voucher' }
};

const normalizeCustomerId = (customerId = '') => {
  return customerId ? customerId.toString().trim() : '';
};

const normalizeVoucherCode = (voucherCode = '') => {
  return (voucherCode || '').toString().trim().toUpperCase();
};

const filterAvailableVouchers = (vouchers = [], orders = []) => {
  const usedVoucherCodes = new Set(
    (Array.isArray(orders) ? orders : [])
      .map((order) => normalizeVoucherCode(order?.voucher?.code))
      .filter(Boolean)
  );

  return (Array.isArray(vouchers) ? vouchers : []).filter((voucher) => {
    return !usedVoucherCodes.has(normalizeVoucherCode(voucher?.code));
  });
};

function StoreProfileHubV2() {
  const context = useContext(MyContext);
  const params = useParams();
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [addressForm, setAddressForm] = useState(AddressBookUtil.createEmptyForm());
  const [savingAddress, setSavingAddress] = useState(false);

  const activeSection = sectionMeta[params.section] ? params.section : 'account';
  const customerId = normalizeCustomerId(context.customer?._id);
  const requestConfig = useMemo(() => ({
    headers: { 'x-access-token': context.token }
  }), [context.token]);

  const loadOrders = useCallback(() => {
    if (!customerId || !context.token) {
      setOrders([]);
      return;
    }

    axios.get(`/api/customer/orders/customer/${encodeURIComponent(customerId)}`, requestConfig).then((res) => {
      setOrders(res.data || []);
    }).catch(() => {
      setOrders([]);
    });
  }, [context.token, customerId, requestConfig]);

  const loadVouchers = useCallback(() => {
    if (!customerId || !context.token) {
      setVouchers([]);
      return;
    }

    axios.get(`/api/customer/vouchers/customer/${encodeURIComponent(customerId)}`, requestConfig).then((res) => {
      setVouchers(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {
      axios.get('/api/customer/vouchers').then((voucherRes) => {
        const activeVouchers = Array.isArray(voucherRes.data) ? voucherRes.data : [];

        axios.get(`/api/customer/orders/customer/${encodeURIComponent(customerId)}`, requestConfig).then((ordersRes) => {
          setVouchers(filterAvailableVouchers(activeVouchers, ordersRes.data));
        }).catch(() => {
          setVouchers(activeVouchers);
        });
      }).catch(() => {
        setVouchers([]);
      });
    });
  }, [context.token, customerId, requestConfig]);

  const loadAddresses = useCallback(() => {
    if (!customerId || !context.token) {
      setAddresses(AddressBookUtil.normalizeAddressList(context.customer?.addresses || []));
      return;
    }

    axios.get(`/api/customer/addresses/customer/${encodeURIComponent(customerId)}`, requestConfig).then((res) => {
      setAddresses(AddressBookUtil.normalizeAddressList(res.data || []));
    }).catch(() => {
      setAddresses(AddressBookUtil.normalizeAddressList(context.customer?.addresses || []));
    });
  }, [context.customer?.addresses, context.token, customerId, requestConfig]);

  useEffect(() => {
    loadOrders();
    loadVouchers();
    loadAddresses();
  }, [loadAddresses, loadOrders, loadVouchers]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') {
      return orders;
    }

    return orders.filter((order) => (order.status || '').toUpperCase() === orderFilter);
  }, [orderFilter, orders]);

  const latestOrder = orders[0] || null;
  const defaultAddress = useMemo(() => AddressBookUtil.getDefaultAddress(addresses), [addresses]);
  const isEditingAddress = Boolean(addressForm._id);
  const applyAddressBook = useCallback((nextAddresses, customerData = null) => {
    const normalizedAddresses = AddressBookUtil.normalizeAddressList(nextAddresses);
    setAddresses(normalizedAddresses);
    context.setCustomer({
      ...(context.customer || {}),
      ...(customerData || {}),
      addresses: normalizedAddresses
    });
    return normalizedAddresses;
  }, [context]);

  const syncAddressBook = useCallback(async (nextAddresses, successMessage) => {
    if (!customerId || !context.token) {
      return false;
    }

    setSavingAddress(true);

    try {
      const res = await axios.put(
        `/api/customer/addresses/customer/${encodeURIComponent(customerId)}`,
        { addresses: nextAddresses },
        requestConfig
      );

      const serverAddresses = AddressBookUtil.normalizeAddressList(res.data?.addresses || []);
      const updateSucceeded = Boolean(res.data?.success);
      const matchesRequestedState = AddressBookUtil.areSameAddressBooks(serverAddresses, nextAddresses);

      if (updateSucceeded || matchesRequestedState) {
        applyAddressBook(
          matchesRequestedState ? serverAddresses : (serverAddresses.length > 0 || nextAddresses.length === 0 ? serverAddresses : nextAddresses),
          res.data?.customer || null
        );

        if (successMessage) {
          window.alert(successMessage);
        }

        return true;
      }

      const latestAddressesResponse = await axios.get(
        `/api/customer/addresses/customer/${encodeURIComponent(customerId)}`,
        requestConfig
      );
      const latestAddresses = AddressBookUtil.normalizeAddressList(latestAddressesResponse.data || []);

      if (AddressBookUtil.areSameAddressBooks(latestAddresses, nextAddresses)) {
        applyAddressBook(latestAddresses, res.data?.customer || null);

        if (successMessage) {
          window.alert(successMessage);
        }

        return true;
      }

      window.alert(res.data?.message || 'Không thể cập nhật địa chỉ.');
      return false;
    } catch (error) {
      try {
        const latestAddressesResponse = await axios.get(
          `/api/customer/addresses/customer/${encodeURIComponent(customerId)}`,
          requestConfig
        );
        const latestAddresses = AddressBookUtil.normalizeAddressList(latestAddressesResponse.data || []);

        if (AddressBookUtil.areSameAddressBooks(latestAddresses, nextAddresses)) {
          applyAddressBook(latestAddresses);

          if (successMessage) {
            window.alert(successMessage);
          }

          return true;
        }
      } catch (refreshError) {
        // Keep the original error message below.
      }

      window.alert(error?.response?.data?.message || 'Không thể cập nhật địa chỉ.');
      return false;
    } finally {
      setSavingAddress(false);
    }
  }, [applyAddressBook, context.token, customerId, requestConfig]);

  const handleAddressFieldChange = (field, value) => {
    setAddressForm((prevState) => ({
      ...prevState,
      [field]: value
    }));
  };

  const resetAddressForm = () => {
    setAddressForm(AddressBookUtil.createEmptyForm());
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = AddressBookUtil.validate(addressForm);
    if (validationMessage) {
      window.alert(validationMessage);
      return;
    }

    const payload = AddressBookUtil.toPayload(addressForm, context.customer);
    const baseAddresses = payload.isDefault
      ? addresses.map((address) => ({ ...address, isDefault: false }))
      : [...addresses];

    const nextAddresses = AddressBookUtil.normalizeAddressList(
      isEditingAddress
        ? baseAddresses.map((address) => {
            return String(address._id || '') === String(addressForm._id)
              ? { ...address, ...payload }
              : address;
          })
        : [...baseAddresses, payload]
    );

    const success = await syncAddressBook(
      nextAddresses,
      'Cập nhật thông tin địa chỉ thành công.'
    );

    if (success) {
      resetAddressForm();
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm(AddressBookUtil.fromAddress(address));
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này không?')) {
      return;
    }

    const nextAddresses = AddressBookUtil.normalizeAddressList(
      addresses.filter((address) => String(address._id || '') !== String(addressId || ''))
    );

    const success = await syncAddressBook(nextAddresses, 'Địa chỉ đã được xóa.');
    if (success && String(addressForm._id || '') === String(addressId || '')) {
      resetAddressForm();
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    const nextAddresses = AddressBookUtil.makeDefault(addresses, addressId);
    await syncAddressBook(nextAddresses, 'Đã cập nhật địa chỉ mặc định.');
  };

  if (context.token === '') {
    return <Navigate replace to="/login" />;
  }

  const breadcrumbs = [
    { label: 'Trang chủ', to: '/home' },
    { label: 'Tài khoản', to: '/myprofile' }
  ];

  if (activeSection !== 'account') {
    breadcrumbs.push({ label: sectionMeta[activeSection].title });
  }

  return (
    <div className="content-page">
      <PageIntro
        title={sectionMeta[activeSection].title}
        eyebrow="Cake House"
        breadcrumbs={breadcrumbs}
      />

      <section className="profile-layout">
        <aside className="profile-layout__sidebar">
          <div className="profile-layout__sidebar-card">
            <div className="profile-layout__identity">
              <div className="profile-layout__avatar">
                {(context.customer?.name || 'C').slice(0, 1).toUpperCase()}
              </div>
              <strong>{context.customer?.name || 'Khách hàng Cake House'}</strong>
            </div>

            <nav className="profile-layout__nav">
              <NavLink end to="/myprofile" className={({ isActive }) => isActive ? 'is-active' : ''}>
                Thông tin tài khoản
              </NavLink>
              <NavLink to="/myprofile/orders" className={({ isActive }) => isActive ? 'is-active' : ''}>
                Đơn hàng
              </NavLink>
              <NavLink to="/myprofile/address" className={({ isActive }) => isActive ? 'is-active' : ''}>
                Địa chỉ
              </NavLink>
              <NavLink to="/myprofile/vouchers" className={({ isActive }) => isActive ? 'is-active' : ''}>
                Voucher của tôi
              </NavLink>
            </nav>

          </div>
        </aside>

        <div className="profile-layout__content">
          {activeSection === 'account' ? (
            <>
              <div className="profile-layout__stats">
                <article className="profile-layout__stat-card">
                  <span className="section-heading__eyebrow">Tài khoản</span>
                  <strong>{context.customer?.username || context.customer?.name || 'Cake House'}</strong>
                  <small>Thông tin đăng nhập và liên hệ</small>
                </article>
                <article className="profile-layout__stat-card">
                  <span className="section-heading__eyebrow">Đơn hàng</span>
                  <strong>{orders.length}</strong>
                  <small>{latestOrder ? `Đơn gần nhất ${StorefrontHelper.formatDate(latestOrder.cdate)}` : 'Chưa có đơn hàng nào'}</small>
                </article>
                <article className="profile-layout__stat-card">
                  <span className="section-heading__eyebrow">Địa chỉ</span>
                  <strong>{addresses.length}</strong>
                  <small>{defaultAddress ? 'Đã có địa chỉ mặc định để tự điền khi thanh toán' : 'Thêm địa chỉ để thanh toán nhanh hơn'}</small>
                </article>
                <article className="profile-layout__stat-card">
                  <span className="section-heading__eyebrow">Voucher của tôi</span>
                  <strong>{vouchers.length}</strong>
                  <small>Các mã ưu đãi còn khả dụng cho tài khoản này</small>
                </article>
              </div>

              <section className="profile-layout__section-card">
                <div className="profile-layout__section-head">
                  <span className="section-heading__eyebrow">Thông tin cá nhân</span>
                  <h3>Chi tiết tài khoản</h3>
                </div>

                <div className="profile-layout__detail-grid">
                  <div>
                    <span>Họ và tên</span>
                    <strong>{context.customer?.name || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{context.customer?.email || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>{context.customer?.phone || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span>Trạng thái</span>
                    <strong>Đang hoạt động</strong>
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {activeSection === 'orders' ? (
            <section className="profile-layout__section-card">
              <div className="profile-layout__section-head">
                <span className="section-heading__eyebrow">Đơn hàng</span>
                <h3>Theo dõi trạng thái đơn hàng</h3>
              </div>

              <div className="profile-layout__order-tabs">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'PENDING', label: 'Chờ xác nhận' },
                  { key: 'APPROVED', label: 'Đã xác nhận' },
                  { key: 'SHIPPING', label: 'Đang giao' },
                  { key: 'DELIVERED', label: 'Đã giao' },
                  { key: 'CANCELED', label: 'Đã hủy' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={orderFilter === item.key ? 'is-active' : ''}
                    onClick={() => setOrderFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filteredOrders.length > 0 ? (
                <div className="profile-layout__order-list">
                  {filteredOrders.map((order) => (
                    <article key={order._id} className="profile-layout__order-card">
                      <div>
                        <strong>{StorefrontHelper.formatDate(order.cdate)}</strong>
                        <span>{StorefrontHelper.getOrderStatusLabel(order.status)}</span>
                      </div>
                      <div>
                        <span>{order.itemCount || order.items?.length || 0} sản phẩm</span>
                        <strong>{StorefrontHelper.formatCurrency(order.total)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state-card">Bạn chưa có đơn hàng phù hợp với bộ lọc này.</div>
              )}
            </section>
          ) : null}

          {activeSection === 'address' ? (
            <section className="profile-layout__section-card">
              <div className="profile-layout__section-head">
                <span className="section-heading__eyebrow">Địa chỉ</span>
                <h3>Địa chỉ giao hàng</h3>
                <small className="profile-layout__section-note">
                  Địa chỉ mặc định sẽ được tự động điền ở trang thanh toán để bạn không phải nhập lại nhiều lần.
                </small>
              </div>

              <div className="profile-layout__address-shell">
                <form className="profile-layout__address-editor" onSubmit={handleAddressSubmit}>
                  <div className="profile-layout__address-editor-head">
                    <h4>{isEditingAddress ? 'Cập nhật địa chỉ nhận hàng' : 'Thêm mới địa chỉ nhận hàng'}</h4>
                    <span>Vui lòng xác nhận các nội dung bên dưới</span>
                  </div>

                  <div className="profile-layout__address-form">
                    <label>
                      <span>Tên</span>
                      <input
                        type="text"
                        value={addressForm.firstName}
                        onChange={(event) => handleAddressFieldChange('firstName', event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Họ</span>
                      <input
                        type="text"
                        value={addressForm.lastName}
                        onChange={(event) => handleAddressFieldChange('lastName', event.target.value)}
                      />
                    </label>
                    <label className="is-full">
                      <span>Công ty</span>
                      <input
                        type="text"
                        value={addressForm.company}
                        onChange={(event) => handleAddressFieldChange('company', event.target.value)}
                      />
                    </label>
                    <label className="is-full">
                      <span>Địa chỉ 1</span>
                      <input
                        type="text"
                        value={addressForm.addressLine1}
                        onChange={(event) => handleAddressFieldChange('addressLine1', event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Tỉnh/Thành</span>
                      <input
                        type="text"
                        value={addressForm.province}
                        onChange={(event) => handleAddressFieldChange('province', event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Quận/Huyện</span>
                      <input
                        type="text"
                        value={addressForm.district}
                        onChange={(event) => handleAddressFieldChange('district', event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Phường/Xã</span>
                      <input
                        type="text"
                        value={addressForm.ward}
                        onChange={(event) => handleAddressFieldChange('ward', event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Số điện thoại</span>
                      <input
                        type="text"
                        value={addressForm.phone}
                        onChange={(event) => handleAddressFieldChange('phone', event.target.value)}
                      />
                    </label>
                  </div>

                  <label className="profile-layout__address-checkbox">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) => handleAddressFieldChange('isDefault', event.target.checked)}
                    />
                    <span>Đặt làm địa chỉ mặc định</span>
                  </label>

                  <div className="profile-layout__address-actions">
                    <button type="submit" className="primary-button" disabled={savingAddress}>
                      {savingAddress ? 'Đang lưu...' : isEditingAddress ? 'Cập nhật địa chỉ' : 'Thêm mới'}
                    </button>
                    <button type="button" className="soft-button" onClick={resetAddressForm}>
                      Làm mới
                    </button>
                  </div>
                </form>

                <div className="profile-layout__address-book">
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <article key={address._id} className="profile-layout__address-card">
                        <div className="profile-layout__address-card-head">
                          <strong>{AddressBookUtil.buildFullName(address, context.customer)}</strong>
                          {address.isDefault ? <em>Địa chỉ mặc định</em> : null}
                        </div>
                        <span>{AddressBookUtil.buildAddressText(address)}</span>
                        <span>{address.phone || context.customer?.phone || 'Chưa có số điện thoại'}</span>
                        {address.company ? <span>{address.company}</span> : null}

                        <div className="profile-layout__address-card-actions">
                          <button type="button" className="soft-button" onClick={() => handleEditAddress(address)}>
                            Chỉnh sửa
                          </button>
                          {!address.isDefault ? (
                            <button type="button" className="soft-button" onClick={() => handleSetDefaultAddress(address._id)}>
                              Đặt mặc định
                            </button>
                          ) : null}
                          <button type="button" className="soft-button is-danger" onClick={() => handleDeleteAddress(address._id)}>
                            Xóa
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      Bạn chưa có địa chỉ giao hàng nào. Hãy thêm một địa chỉ để checkout tự điền nhanh hơn.
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'vouchers' ? (
            <section className="profile-layout__section-card">
              <div className="profile-layout__section-head">
                <span className="section-heading__eyebrow">Voucher</span>
                <h3>Ưu đãi còn khả dụng</h3>
              </div>

              {vouchers.length > 0 ? (
                <div className="voucher-list">
                  {vouchers.map((voucher) => {
                    const visual = StorefrontHelper.getVoucherVisual(voucher);
                    return (
                      <div key={voucher._id} className={visual.cardClassName}>
                        <span className="voucher-card__icon" aria-label={visual.iconLabel}>
                          {voucher.type === 'freeship' ? 'Xe' : 'Sale'}
                        </span>
                        <span className="voucher-card__content">
                          <strong>{voucher.title}</strong>
                          <small>Mã: {voucher.code}</small>
                          <small>
                            {voucher.type === 'freeship'
                              ? `Freeship từ ${StorefrontHelper.formatCurrency(voucher.minOrder)}`
                              : `Giảm ${StorefrontHelper.formatCurrency(voucher.discount)} cho đơn từ ${StorefrontHelper.formatCurrency(voucher.minOrder)}`}
                          </small>
                        </span>
                        <span className="voucher-card__badge">{visual.badge}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-card">Tài khoản của bạn hiện chưa còn voucher nào khả dụng.</div>
              )}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default StoreProfileHubV2;

