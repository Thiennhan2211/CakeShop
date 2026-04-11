import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import PageIntro from './PageIntroComponent';
import StorefrontUtil from '../utils/StorefrontUtil';

const SECTION_META = {
  account: { title: 'Thông tin tài khoản', badge: 'Tài khoản' },
  orders: { title: 'Đơn hàng', badge: 'Đơn hàng' },
  address: { title: 'Địa chỉ', badge: 'Địa chỉ' },
  vouchers: { title: 'Voucher của tôi', badge: 'Voucher' }
};

function ProfileHub() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const params = useParams();
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');

  useEffect(() => {
    if (!context.customer || !context.token) {
      return;
    }

    const config = { headers: { 'x-access-token': context.token } };

    axios.get(`/api/customer/orders/customer/${context.customer._id}`, config).then((res) => {
      setOrders(res.data || []);
    }).catch(() => {
      setOrders([]);
    });

    axios.get('/api/customer/vouchers').then((res) => {
      setVouchers(res.data || []);
    }).catch(() => {
      setVouchers([]);
    });
  }, [context.customer, context.token]);

  const activeSection = useMemo(() => {
    return SECTION_META[params.section] ? params.section : 'account';
  }, [params.section]);

  const addressBook = useMemo(() => {
    const uniqueAddresses = new Map();

    orders.forEach((order) => {
      const deliveryInfo = order.deliveryInfo || {};
      const address = (deliveryInfo.address || '').trim();
      if (!address) {
        return;
      }

      const key = `${deliveryInfo.fullName || ''}-${deliveryInfo.phone || ''}-${address}`;
      if (!uniqueAddresses.has(key)) {
        uniqueAddresses.set(key, {
          fullName: deliveryInfo.fullName || context.customer?.name || '',
          phone: deliveryInfo.phone || context.customer?.phone || '',
          email: deliveryInfo.email || context.customer?.email || '',
          address,
          isDefault: uniqueAddresses.size === 0
        });
      }
    });

    if (uniqueAddresses.size === 0 && context.customer?.name && context.customer?.phone) {
      uniqueAddresses.set('default-customer-address', {
        fullName: context.customer.name,
        phone: context.customer.phone,
        email: context.customer.email || '',
        address: '',
        isDefault: true
      });
    }

    return Array.from(uniqueAddresses.values());
  }, [context.customer, orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') {
      return orders;
    }

    return orders.filter((order) => (order.status || '').toUpperCase() === orderFilter);
  }, [orderFilter, orders]);

  const latestOrder = orders[0] || null;

  const handleLogout = () => {
    context.setToken('');
    context.setCustomer(null);
    context.setMycart([]);
    context.setAppliedVoucher(null);
    navigate('/home');
  };

  const renderAccountSection = () => (
    <>
      <div className="profile-summary-grid">
        <article className="profile-summary-card">
          <span className="section-heading__eyebrow">Tài khoản</span>
          <strong>{context.customer?.username || context.customer?.name || 'Cake House'}</strong>
          <small>Thông tin đăng nhập và liên hệ</small>
        </article>
        <article className="profile-summary-card">
          <span className="section-heading__eyebrow">Đơn hàng</span>
          <strong>{orders.length}</strong>
          <small>{latestOrder ? `Đơn gần nhất ${StorefrontUtil.formatDate(latestOrder.cdate)}` : 'Chưa có đơn hàng nào'}</small>
        </article>
        <article className="profile-summary-card">
          <span className="section-heading__eyebrow">Địa chỉ</span>
          <strong>{addressBook.length}</strong>
          <small>Địa chỉ giao nhận mặc định</small>
        </article>
        <article className="profile-summary-card">
          <span className="section-heading__eyebrow">Voucher của tôi</span>
          <strong>{vouchers.length}</strong>
          <small>Các mã đang hoạt động</small>
        </article>
      </div>

      <section className="profile-section-card">
        <div className="profile-section-card__header">
          <span className="section-heading__eyebrow">Thông tin cá nhân</span>
          <h3>Chi tiết tài khoản</h3>
        </div>

        <div className="profile-detail-list">
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
  );

  const renderOrdersSection = () => {
    const orderTabs = [
      { key: 'all', label: 'Tất cả' },
      { key: 'PENDING', label: 'Chờ xác nhận' },
      { key: 'APPROVED', label: 'Đã xác nhận' },
      { key: 'SHIPPING', label: 'Đang giao' },
      { key: 'DELIVERED', label: 'Đã giao' },
      { key: 'CANCELED', label: 'Đã hủy' }
    ];

    return (
      <section className="profile-section-card">
        <div className="profile-section-card__header">
          <span className="section-heading__eyebrow">Đơn hàng</span>
          <h3>Theo dõi trạng thái đơn hàng</h3>
        </div>

        <div className="profile-order-tabs">
          {orderTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={orderFilter === tab.key ? 'is-active' : ''}
              onClick={() => setOrderFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="profile-order-board">
            {filteredOrders.map((order) => (
              <article key={order._id} className="profile-order-card">
                <div>
                  <strong>{StorefrontUtil.formatDate(order.cdate)}</strong>
                  <span>{StorefrontUtil.getOrderStatusLabel(order.status)}</span>
                </div>
                <div>
                  <span>{order.items?.length || 0} sản phẩm</span>
                  <strong>{StorefrontUtil.formatCurrency(order.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">Bạn chưa có đơn hàng phù hợp với bộ lọc này.</div>
        )}
      </section>
    );
  };

  const renderAddressSection = () => (
    <section className="profile-section-card">
      <div className="profile-section-card__header">
        <span className="section-heading__eyebrow">Địa chỉ</span>
        <h3>Địa chỉ giao hàng</h3>
      </div>

      {addressBook.length > 0 ? (
        <div className="profile-address-list">
          {addressBook.map((address, index) => (
            <article key={`${address.fullName}-${index}`} className="profile-address-card">
              <strong>{address.fullName || 'Khách hàng Cake House'}</strong>
              {address.address ? <span>{address.address}</span> : <span>Bạn chưa có địa chỉ chi tiết, hệ thống sẽ dùng thông tin ở bước thanh toán.</span>}
              <span>{address.phone || 'Chưa có số điện thoại'}</span>
              {address.email ? <span>{address.email}</span> : null}
              {address.isDefault ? <em>Địa chỉ mặc định</em> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state-card">Bạn chưa có địa chỉ giao hàng nào.</div>
      )}
    </section>
  );

  const renderVoucherSection = () => (
      <section className="profile-section-card">
        <div className="profile-section-card__header">
          <span className="section-heading__eyebrow">Voucher</span>
          <h3>Ưu đãi đang khả dụng</h3>
        </div>

      {vouchers.length > 0 ? (
        <div className="voucher-list">
          {vouchers.map((voucher) => {
            const visual = StorefrontUtil.getVoucherVisual(voucher);

            return (
              <div key={voucher._id} className={visual.cardClassName}>
                <span className="voucher-card__icon" aria-label={visual.iconLabel}>
                  {voucher.type === 'freeship' ? 'Xe' : 'Sale'}
                </span>
                <span className="voucher-card__content">
                  <strong>{voucher.title}</strong>
                  <small>Ma: {voucher.code}</small>
                  <small>
                  {voucher.type === 'freeship'
                      ? `Freeship từ ${StorefrontUtil.formatCurrency(voucher.minOrder)}`
                      : `Giảm ${StorefrontUtil.formatCurrency(voucher.discount)} cho đơn từ ${StorefrontUtil.formatCurrency(voucher.minOrder)}`}
                  </small>
                </span>
                <span className="voucher-card__badge">{visual.badge}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-card">Hiện chưa có voucher nào khả dụng.</div>
      )}
    </section>
  );

  if (context.token === '') {
    return <Navigate replace to="/login" />;
  }

  const sectionMeta = SECTION_META[activeSection];
  const breadcrumbs = [
    { label: 'Trang chủ', to: '/home' },
    { label: 'Tài khoản', to: '/myprofile' }
  ];

  if (activeSection !== 'account') {
    breadcrumbs.push({ label: sectionMeta.title });
  }

  return (
    <div className="content-page">
      <PageIntro
        title={sectionMeta.title}
        eyebrow="Cake House"
        breadcrumbs={breadcrumbs}
      />

      <section className="profile-shell">
        <aside className="profile-shell__sidebar">
          <div className="profile-sidebar-card">
            <div className="profile-sidebar-card__head">
              <div className="profile-avatar">
                {(context.customer?.name || 'C').slice(0, 1)}
              </div>
              <div>
                <strong>{context.customer?.name || 'Khách hàng Cake House'}</strong>
              </div>
            </div>

            <nav className="profile-shell__menu">
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

            <button type="button" className="profile-shell__logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className="profile-shell__content">
          {activeSection === 'account' ? renderAccountSection() : null}
          {activeSection === 'orders' ? renderOrdersSection() : null}
          {activeSection === 'address' ? renderAddressSection() : null}
          {activeSection === 'vouchers' ? renderVoucherSection() : null}
        </div>
      </section>
    </div>
  );
}

export default ProfileHub;

