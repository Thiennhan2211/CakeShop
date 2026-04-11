import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import CartUtil from '../utils/CartUtil';
import StorefrontHelper from '../utils/StorefrontHelper';
import PageIntro from './PageIntroComponent';

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi giao hàng (COD)' },
  { value: 'BANKING', label: 'Chuyển khoản ngân hàng' },
  { value: 'MOMO', label: 'Ví MoMo' },
  { value: 'ZALOPAY', label: 'ZaloPay' }
];

function StoreCheckout() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    paymentMethod: 'COD'
  });
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    return CartUtil.getSummary(
      context.mycart,
      context.appliedVoucher,
      StorefrontHelper.defaultShippingFee
    );
  }, [context.mycart, context.appliedVoucher]);

  useEffect(() => {
    if (!context.customer) {
      return;
    }

    setForm((prevState) => ({
      ...prevState,
      fullName: context.customer.name || '',
      phone: context.customer.phone || '',
      email: context.customer.email || ''
    }));
  }, [context.customer]);

  if (context.token === '') {
    return <Navigate replace to="/login" />;
  }

  if (context.mycart.length === 0) {
    return <Navigate replace to="/mycart" />;
  }

  const handleFieldChange = (field, value) => {
    setForm((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      window.alert('Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post(
        '/api/customer/checkout',
        {
          items: context.mycart,
          customer: context.customer,
          voucher: context.appliedVoucher,
          paymentMethod: form.paymentMethod,
          deliveryInfo: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            address: form.address,
            note: form.note
          }
        },
        { headers: { 'x-access-token': context.token } }
      );

      const result = res.data;
      if (!result?.success) {
        window.alert(result?.message || 'Không thể tạo đơn hàng lúc này.');
        return;
      }

      context.setMycart([]);
      context.setAppliedVoucher(null);
      navigate('/checkout/success', {
        replace: true,
        state: {
          deferredPayment: Boolean(result.deferredPayment),
          paymentMethod: form.paymentMethod,
          orderTotal: Number(result?.order?.total) || 0
        }
      });
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Không thể tạo đơn hàng lúc này.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-page">
      <PageIntro
        title="Thanh toán"
        eyebrow="Cake House"
        breadcrumbs={[
          { label: 'Trang chủ', to: '/home' },
          { label: 'Giỏ hàng', to: '/mycart' },
          { label: 'Thanh toán' }
        ]}
      />

      <section className="checkout-layout">
        <div className="checkout-layout__main">
          <section className="checkout-card">
            <div className="checkout-card__header">
              <span className="section-heading__eyebrow">Tài khoản</span>
              <h3>Thông tin khách hàng</h3>
            </div>
            <div className="checkout-account">
              <strong>{context.customer?.name}</strong>
              <span>{context.customer?.email}</span>
              <span>{context.customer?.phone}</span>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card__header">
              <span className="section-heading__eyebrow">Giao hàng</span>
              <h3>Thông tin giao nhận</h3>
            </div>

            <div className="checkout-form-grid">
              <label>
                <span>Họ và tên</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => handleFieldChange('fullName', event.target.value)}
                />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                />
              </label>
              <label className="checkout-form-grid__full">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                />
              </label>
              <label className="checkout-form-grid__full">
                <span>Địa chỉ giao hàng</span>
                <input
                  type="text"
                  value={form.address}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  onChange={(event) => handleFieldChange('address', event.target.value)}
                />
              </label>
              <label className="checkout-form-grid__full">
                <span>Ghi chú đơn hàng</span>
                <textarea
                  rows="4"
                  value={form.note}
                  placeholder="Thêm lưu ý giao hàng hoặc thời gian nhận bánh"
                  onChange={(event) => handleFieldChange('note', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card__header">
              <span className="section-heading__eyebrow">Thanh toán</span>
              <h3>Phương thức thanh toán</h3>
            </div>

            <div className="payment-method-list">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  className={`payment-method-item ${form.paymentMethod === method.value ? 'is-active' : ''}`}
                  onClick={() => handleFieldChange('paymentMethod', method.value)}
                >
                  <span className="payment-method-item__radio" />
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="checkout-layout__sidebar">
          <section className="checkout-card">
            <div className="checkout-card__header">
              <span className="section-heading__eyebrow">Giỏ hàng</span>
              <h3>Sản phẩm đã chọn</h3>
            </div>

            <div className="checkout-order-list">
              {context.mycart.map((item, index) => (
                <article key={`${item.product._id}-${index}`} className="checkout-order-item">
                  <img src={`data:image/jpg;base64,${item.product.image}`} alt={item.product.name} />
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{item.size ? `Size ${item.size}` : 'Size mặc định'}</span>
                    {item.note ? <span>{item.note}</span> : null}
                    <span>Số lượng: {item.quantity}</span>
                  </div>
                  <strong>{StorefrontHelper.formatCurrency(item.product.price * item.quantity)}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card__header">
              <span className="section-heading__eyebrow">Tóm tắt</span>
              <h3>Chi tiết thanh toán</h3>
            </div>

            <div className="cart-summary-list">
              <div>
                <span>Tổng tiền hàng</span>
                <strong>{StorefrontHelper.formatCurrency(summary.subtotal)}</strong>
              </div>
              <div>
                <span>Phí vận chuyển</span>
                <strong>
                  {context.appliedVoucher?.type === 'freeship'
                    ? 'Miễn phí'
                    : StorefrontHelper.formatCurrency(StorefrontHelper.defaultShippingFee)}
                </strong>
              </div>
              {summary.discountAmount > 0 ? (
                <div>
                  <span>Voucher áp dụng</span>
                  <strong>-{StorefrontHelper.formatCurrency(summary.discountAmount)}</strong>
                </div>
              ) : null}
              {context.appliedVoucher ? (
                <div>
                  <span>Mã ưu đãi</span>
                  <strong>{context.appliedVoucher.code}</strong>
                </div>
              ) : null}
              <div className="is-total">
                <span>Tổng thanh toán</span>
                <strong>{StorefrontHelper.formatCurrency(summary.total)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </section>
        </aside>
      </section>
    </div>
  );
}

export default StoreCheckout;
