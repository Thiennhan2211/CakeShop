import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import CartUtil from '../utils/CartUtil';
import StorefrontUtil from '../utils/StorefrontUtil';
import PageIntro from './PageIntroComponent';

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 5h11a1 1 0 0 1 1 1v4h2.2a2 2 0 0 1 1.56.75l1.8 2.25c.28.35.44.79.44 1.25V17a1 1 0 0 1-1 1h-1.18a2.82 2.82 0 0 1-5.64 0H9.82a2.82 2.82 0 0 1-5.64 0H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2 11a.82.82 0 1 0 0 1.64A.82.82 0 0 0 5 16Zm11 0a.82.82 0 1 0 0 1.64A.82.82 0 0 0 16 16Zm1-4v1h2.08l-1.2-1.5a.6.6 0 0 0-.47-.22H17Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2.1a2 2 0 0 0 0 4.8v2.1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-2.1a2 2 0 0 0 0-4.8V7.5Zm5 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm0 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm4-8.4-4 8.8h2l4-8.8h-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

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

function CartPage() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const summary = useMemo(() => {
    return CartUtil.getSummary(
      context.mycart,
      context.appliedVoucher,
      StorefrontUtil.defaultShippingFee
    );
  }, [context.mycart, context.appliedVoucher]);

  useEffect(() => {
    let didCancel = false;
    const customerId = normalizeCustomerId(context.customer?._id);

    const loadAvailableVouchers = async () => {
      try {
        if (!customerId || !context.token) {
          const activeVoucherResponse = await axios.get('/api/customer/vouchers');
          const activeVouchers = Array.isArray(activeVoucherResponse.data)
            ? activeVoucherResponse.data
            : [];

          if (!didCancel) {
            setVouchers(activeVouchers);
          }
          return;
        }

        try {
          const availableVoucherResponse = await axios.get(
            `/api/customer/vouchers/customer/${encodeURIComponent(customerId)}`,
            { headers: { 'x-access-token': context.token } }
          );

          if (!didCancel) {
            setVouchers(Array.isArray(availableVoucherResponse.data) ? availableVoucherResponse.data : []);
          }
        } catch (error) {
          const activeVoucherResponse = await axios.get('/api/customer/vouchers');
          const activeVouchers = Array.isArray(activeVoucherResponse.data)
            ? activeVoucherResponse.data
            : [];

          try {
            const ordersResponse = await axios.get(
              `/api/customer/orders/customer/${encodeURIComponent(customerId)}`,
              { headers: { 'x-access-token': context.token } }
            );
            const nextVouchers = filterAvailableVouchers(activeVouchers, ordersResponse.data);

            if (!didCancel) {
              setVouchers(nextVouchers);
            }
          } catch (orderError) {
            if (!didCancel) {
              setVouchers(activeVouchers);
            }
          }
        }
      } catch (error) {
        if (!didCancel) {
          setVouchers([]);
        }
      }
    };

    loadAvailableVouchers();
    return () => {
      didCancel = true;
    };
  }, [context.customer?._id, context.token]);

  useEffect(() => {
    if (!context.appliedVoucher) {
      return;
    }

    if (summary.subtotal < Number(context.appliedVoucher.minOrder || 0)) {
      context.setAppliedVoucher(null);
      setCouponStatus('error');
      setCouponMessage('Coupon không hợp lệ hoặc chưa đạt giá trị tối thiểu!');
    }
  }, [context, summary.subtotal]);

  const handleApplyVoucher = (voucher) => {
    if (!voucher) {
      setCouponStatus('error');
      setCouponMessage('Coupon không hợp lệ hoặc chưa đạt giá trị tối thiểu!');
      context.setAppliedVoucher(null);
      return;
    }

    if (summary.subtotal < Number(voucher.minOrder || 0)) {
      setCouponStatus('error');
      setCouponMessage('Coupon không hợp lệ hoặc chưa đạt giá trị tối thiểu!');
      context.setAppliedVoucher(null);
      return;
    }

    context.setAppliedVoucher(voucher);
    setCouponCode(voucher.code || '');
    setCouponStatus('success');
    setCouponMessage('Áp dụng mã thành công!');
  };

  const handleManualApply = () => {
    const matchedVoucher = vouchers.find((voucher) => {
      return (voucher.code || '').toUpperCase() === couponCode.trim().toUpperCase();
    });

    handleApplyVoucher(matchedVoucher);
  };

  const handleQuantityChange = (item, quantity) => {
    const nextCart = CartUtil.updateQuantity(
      context.mycart,
      item.product._id,
      quantity,
      item.size,
      item.note
    );
    context.setMycart(nextCart);
  };

  const handleRemove = (item) => {
    const nextCart = CartUtil.removeItem(
      context.mycart,
      item.product._id,
      item.size,
      item.note
    );
    context.setMycart(nextCart);
  };

  const handleCheckout = () => {
    if (!context.token || !context.customer) {
      navigate('/login');
      return;
    }

    if (context.mycart.length === 0) {
      return;
    }

    navigate('/checkout');
  };

  if (context.token === '' && context.mycart.length > 0) {
    return (
      <div className="content-page">
        <PageIntro
          title="Giỏ hàng"
          eyebrow="Cake House"
          breadcrumbs={[{ label: 'Trang chủ', to: '/home' }, { label: 'Giỏ hàng' }]}
        />
        <section className="empty-state-card">
          Vui lòng <Link to="/login">đăng nhập</Link> để tiếp tục thanh toán.
        </section>
      </div>
    );
  }

  return (
    <div className="content-page">
      <PageIntro
        title="Giỏ hàng của bạn"
        eyebrow="Cake House"
        breadcrumbs={[{ label: 'Trang chủ', to: '/home' }, { label: 'Giỏ hàng' }]}
      />

      <section className="cart-dashboard">
        <div className="cart-dashboard__main">
          {context.mycart.length > 0 ? (
            context.mycart.map((item, index) => (
              <article key={`${item.product._id}-${item.size || 'default'}-${item.note || index}`} className="cart-product-card">
                <div className="cart-product-card__media">
                  <img
                    src={`data:image/jpg;base64,${item.product.image}`}
                    alt={item.product.name}
                  />
                </div>

                <div className="cart-product-card__content">
                  <span className="section-heading__eyebrow">{item.product.category?.name || 'Cake House'}</span>
                  <h3>{item.product.name}</h3>
                  <div className="cart-product-card__meta">
                    {item.size ? <span>Size {item.size}</span> : <span>Size mặc định</span>}
                    {item.note ? <span>Lời nhắn: {item.note}</span> : null}
                  </div>
                  <strong>{StorefrontUtil.formatCurrency(item.product.price)}</strong>
                </div>

                <div className="cart-product-card__tools">
                  <div className="product-modal__quantity">
                    <button type="button" onClick={() => handleQuantityChange(item, item.quantity - 1)}>
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(event) => handleQuantityChange(item, Number(event.target.value.replace(/\D/g, '')) || 1)}
                    />
                    <button type="button" onClick={() => handleQuantityChange(item, item.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <strong className="cart-product-card__line-total">
                    {StorefrontUtil.formatCurrency(item.product.price * item.quantity)}
                  </strong>

                  <button type="button" className="soft-button" onClick={() => handleRemove(item)}>
                    Xóa
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state-card">
              Giỏ hàng của bạn đang trống. <Link to="/home">Xem thêm bánh mới</Link>.
            </div>
          )}
        </div>

        <aside className="cart-dashboard__sidebar">
          <section className="cart-side-card">
            <div className="cart-side-card__header">
              <span className="section-heading__eyebrow">Mã giảm giá</span>
              <h3>Coupon của Cake House</h3>
            </div>

            <div className="voucher-list">
              {vouchers.map((voucher) => {
                const visual = StorefrontUtil.getVoucherVisual(voucher);
                const isActive = context.appliedVoucher?._id === voucher._id;

                return (
                  <button
                    key={voucher._id}
                    type="button"
                    className={`${visual.cardClassName} ${isActive ? 'is-active' : ''}`.trim()}
                    onClick={() => handleApplyVoucher(voucher)}
                  >
                    <span className="voucher-card__icon" aria-label={visual.iconLabel}>
                      {voucher.type === 'freeship' ? <TruckIcon /> : <TicketIcon />}
                    </span>
                    <span className="voucher-card__content">
                      <strong>{voucher.title}</strong>
                      <small>
                        {voucher.type === 'freeship'
                          ? `Đơn tối thiểu ${StorefrontUtil.formatCurrency(voucher.minOrder)}`
                          : `Giảm ${StorefrontUtil.formatCurrency(voucher.discount)} cho đơn từ ${StorefrontUtil.formatCurrency(voucher.minOrder)}`}
                      </small>
                      <small>Mã: {voucher.code}</small>
                    </span>
                    <span className="voucher-card__badge">{visual.badge}</span>
                  </button>
                );
              })}
            </div>

            <div className="coupon-form">
              <input
                type="text"
                value={couponCode}
                placeholder="Nhập mã giảm giá"
                onChange={(event) => setCouponCode(event.target.value)}
              />
              <button type="button" className="primary-button" onClick={handleManualApply}>
                Áp dụng
              </button>
            </div>

            {couponMessage ? (
              <div className={`coupon-message ${couponStatus === 'success' ? 'is-success' : 'is-error'}`}>
                {couponMessage}
              </div>
            ) : null}
          </section>

          <section className="cart-side-card">
            <div className="cart-side-card__header">
              <span className="section-heading__eyebrow">Tóm tắt</span>
              <h3>Thông tin thanh toán</h3>
            </div>

            <div className="cart-summary-list">
              <div>
                <span>Tạm tính</span>
                <strong>{StorefrontUtil.formatCurrency(summary.subtotal)}</strong>
              </div>
              <div>
                <span>Phí vận chuyển</span>
                <strong>
                  {context.appliedVoucher?.type === 'freeship'
                    ? 'Miễn phí'
                    : StorefrontUtil.formatCurrency(StorefrontUtil.defaultShippingFee)}
                </strong>
              </div>
              {summary.discountAmount > 0 ? (
                <div>
                  <span>Giảm giá</span>
                  <strong>-{StorefrontUtil.formatCurrency(summary.discountAmount)}</strong>
                </div>
              ) : null}
              <div className="is-total">
                <span>Tổng cộng</span>
                <strong>{StorefrontUtil.formatCurrency(summary.total)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              disabled={context.mycart.length === 0}
              onClick={handleCheckout}
            >
              Tiến hành thanh toán
            </button>
          </section>
        </aside>
      </section>
    </div>
  );
}

export default CartPage;
