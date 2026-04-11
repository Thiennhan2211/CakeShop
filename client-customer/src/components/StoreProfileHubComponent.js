import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import PageIntro from './PageIntroComponent';
import StorefrontHelper from '../utils/StorefrontHelper';

const sectionMeta = {
  account: { title: 'Thông tin tài khoản', badge: 'Tài khoản' },
  orders: { title: 'Đơn hàng', badge: 'Đơn hàng' },
  address: { title: 'Địa chỉ', badge: 'Địa chỉ' },
  vouchers: { title: 'Voucher của tôi', badge: 'Voucher' }
};

function StoreProfileHub() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const params = useParams();
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');

  const activeSection = sectionMeta[params.section] ? params.section : 'account';

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

  const addressBook = useMemo(() => {
    const bucket = new Map();

    orders.forEach((order) => {
      const deliveryInfo = order.deliveryInfo || {};
      const address = (deliveryInfo.address || '').trim();
      const fullName = (deliveryInfo.fullName || context.customer?.name || '').trim();
      const phone = (deliveryInfo.phone || context.customer?.phone || '').trim();
      const email = (deliveryInfo.email || context.customer?.email || '').trim();

      if (!address && !fullName && !phone) {
        return;
      }

      const key = `${fullName}-${phone}-${address}`;
      if (!bucket.has(key)) {
        bucket.set(key, {
          fullName,
          phone,
          email,
          address,
          isDefault: bucket.size === 0
        });
      }
    });

    if (bucket.size === 0 && context.customer) {
      bucket.set('default-address', {
        fullName: context.customer.name || '',
        phone: context.customer.phone || '',
        email: context.customer.email || '',
        address: '',
        isDefault: true
      });
    }

    return Array.from(bucket.values());
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

            <button type="button" className="profile-layout__logout" onClick={handleLogout}>
              Đăng xuất
            </button>
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
                  <strong>{addressBook.length}</strong>
                  <small>Địa chỉ giao nhận mặc định</small>
                </article>
                <article className="profile-layout__stat-card">
                  <span className="section-heading__eyebrow">Voucher của tôi</span>
                  <strong>{vouchers.length}</strong>
                  <small>Các mã ưu đãi đang hoạt động</small>
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
                        <span>{order.items?.length || 0} sản phẩm</span>
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
              </div>

              {addressBook.length > 0 ? (
                <div className="profile-layout__address-list">
                  {addressBook.map((address, index) => (
                    <article key={`${address.fullName}-${index}`} className="profile-layout__address-card">
                      <strong>{address.fullName || 'Khách hàng Cake House'}</strong>
                      <span>{address.address || 'Bạn có thể cập nhật địa chỉ ở bước thanh toán khi đặt đơn.'}</span>
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
          ) : null}

          {activeSection === 'vouchers' ? (
            <section className="profile-layout__section-card">
              <div className="profile-layout__section-head">
                <span className="section-heading__eyebrow">Voucher</span>
                <h3>Ưu đãi đang khả dụng</h3>
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
                <div className="empty-state-card">Hiện chưa có voucher nào khả dụng.</div>
              )}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default StoreProfileHub;

