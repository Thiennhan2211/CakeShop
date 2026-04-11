import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import StorefrontUtil from '../utils/StorefrontUtil';
import PageIntro from './PageIntroComponent';

function ProfileDashboard() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);

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

  const addressCount = useMemo(() => {
    return context.customer?.name && context.customer?.phone ? 1 : 0;
  }, [context.customer]);

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

  return (
    <div className="content-page">
      <PageIntro
        title="Tài khoản của tôi"
        eyebrow="Cake House"
        breadcrumbs={[{ label: 'Trang chủ', to: '/home' }, { label: 'Tài khoản' }]}
      />

      <section className="profile-dashboard">
        <aside className="profile-sidebar-card">
          <div className="profile-sidebar-card__head">
            <div className="profile-avatar">
              {(context.customer?.name || 'C').slice(0, 1)}
            </div>
            <div>
              <strong>{context.customer?.name}</strong>
              <span>{context.customer?.email}</span>
            </div>
          </div>

          <div className="profile-sidebar-card__links">
            <Link to="/myprofile">Thông tin tài khoản</Link>
            <Link to="/myorders">Đơn hàng</Link>
            <Link to="/mycart">Giỏ hàng</Link>
            <button type="button" onClick={handleLogout}>Đăng xuất</button>
          </div>
        </aside>

        <div className="profile-dashboard__content">
          <div className="profile-stat-grid">
            <article className="profile-stat-card">
              <span className="section-heading__eyebrow">Tài khoản</span>
              <strong>{context.customer?.username}</strong>
              <small>Thông tin đăng nhập và liên hệ</small>
            </article>
            <article className="profile-stat-card">
              <span className="section-heading__eyebrow">Đơn hàng</span>
              <strong>{orders.length}</strong>
              <small>{latestOrder ? `Đơn gần nhất ${StorefrontUtil.formatDate(latestOrder.cdate)}` : 'Chưa có đơn hàng nào'}</small>
            </article>
            <article className="profile-stat-card">
              <span className="section-heading__eyebrow">Số địa chỉ</span>
              <strong>{addressCount}</strong>
              <small>Địa chỉ giao nhận mặc định</small>
            </article>
            <article className="profile-stat-card">
              <span className="section-heading__eyebrow">Voucher của tôi</span>
              <strong>{vouchers.length}</strong>
              <small>Các mã ưu đãi đang hoạt động</small>
            </article>
          </div>

          <section className="profile-detail-card">
            <div className="profile-detail-card__header">
              <span className="section-heading__eyebrow">Thông tin tài khoản</span>
              <h3>Chi tiết khách hàng</h3>
            </div>

            <div className="profile-detail-list">
              <div>
                <span>Họ và tên</span>
                <strong>{context.customer?.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{context.customer?.email}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{context.customer?.phone}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>Đang hoạt động</strong>
              </div>
            </div>
          </section>

          <section className="profile-detail-card">
            <div className="profile-detail-card__header">
              <span className="section-heading__eyebrow">Đơn hàng gần đây</span>
              <h3>Lịch sử mua sắm</h3>
            </div>

            {orders.length > 0 ? (
              <div className="profile-order-list">
                {orders.slice(0, 4).map((order) => (
                  <button
                    key={order._id}
                    type="button"
                    className="profile-order-item"
                    onClick={() => navigate('/myorders')}
                  >
                    <div>
                      <strong>{StorefrontUtil.formatDate(order.cdate)}</strong>
                      <span>{StorefrontUtil.getOrderStatusLabel(order.status)}</span>
                    </div>
                    <strong>{StorefrontUtil.formatCurrency(order.total)}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">Bạn chưa có đơn hàng nào.</div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default ProfileDashboard;
