import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import PageIntro from './PageIntroComponent';
import StorefrontHelper from '../utils/StorefrontHelper';

function StoreCheckoutSuccess() {
  const location = useLocation();
  const state = location.state || {};

  if (!('deferredPayment' in state)) {
    return <Navigate replace to="/home" />;
  }

  const title = state.deferredPayment ? 'Đơn hàng đã được ghi nhận' : 'Chúc mừng bạn đã đặt hàng thành công';
  const description = state.deferredPayment
    ? `Phương thức ${StorefrontHelper.getPaymentMethodLabel(state.paymentMethod)} đang được cập nhật. Cake House đã tạo đơn hàng tạm với giá trị ${StorefrontHelper.formatCurrency(state.orderTotal)} và sẽ liên hệ để xác nhận sớm nhất.`
    : `Cake House đã nhận đơn hàng của bạn với tổng thanh toán ${StorefrontHelper.formatCurrency(state.orderTotal)}. Chúng mình sẽ chuẩn bị bánh và liên hệ xác nhận ngay.`;

  return (
    <div className="content-page">
      <PageIntro
        title="Hoàn tất thanh toán"
        eyebrow="Cake House"
        breadcrumbs={[
          { label: 'Trang chủ', to: '/home' },
          { label: 'Thanh toán', to: '/checkout' },
          { label: 'Hoàn tất' }
        ]}
      />

      <section className="checkout-success-card">
        <span className="section-heading__eyebrow">
          {state.deferredPayment ? 'Đang cập nhật' : 'Thành công'}
        </span>
        <h2>{title}</h2>
        <div className="checkout-success-card__copy">{description}</div>

        <div className="checkout-success-card__actions">
          <Link to="/myprofile/orders" className="primary-button">
            Xem đơn hàng
          </Link>
          <Link to="/home" className="soft-button">
            Quay về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}

export default StoreCheckoutSuccess;
