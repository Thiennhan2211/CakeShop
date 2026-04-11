import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import AddressBookUtil from '../utils/AddressBookUtil';
import CartUtil from '../utils/CartUtil';
import StorefrontHelper from '../utils/StorefrontHelper';
import PageIntro from './PageIntroComponent';

const paymentMethods = [
  {
    value: 'COD',
    label: 'Thanh toán khi giao hàng (COD)',
    description: 'Cake House sẽ liên hệ xác nhận đơn và bạn thanh toán khi nhận bánh.',
    available: true
  },
  {
    value: 'BANKING',
    label: 'Chuyển khoản ngân hàng',
    description: 'Đang cập nhật',
    available: false
  },
  {
    value: 'MOMO',
    label: 'Ví MoMo',
    description: 'Đang cập nhật',
    available: false
  },
  {
    value: 'ZALOPAY',
    label: 'ZaloPay',
    description: 'Đang cập nhật',
    available: false
  }
];

function StoreCheckoutV2() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const customerId = context.customer?._id ? context.customer._id.toString().trim() : '';
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    paymentMethod: 'COD'
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(false);

  const summary = useMemo(() => {
    return CartUtil.getSummary(
      context.mycart,
      context.appliedVoucher,
      StorefrontHelper.defaultShippingFee
    );
  }, [context.mycart, context.appliedVoucher]);

  const defaultAddress = useMemo(() => AddressBookUtil.getDefaultAddress(addresses), [addresses]);

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

  useEffect(() => {
    if (!customerId || !context.token) {
      setAddresses(AddressBookUtil.normalizeAddressList(context.customer?.addresses || []));
      return;
    }

    axios.get(
      `/api/customer/addresses/customer/${encodeURIComponent(customerId)}`,
      { headers: { 'x-access-token': context.token } }
    ).then((res) => {
      setAddresses(AddressBookUtil.normalizeAddressList(res.data || []));
    }).catch(() => {
      setAddresses(AddressBookUtil.normalizeAddressList(context.customer?.addresses || []));
    });
  }, [customerId, context.customer?.addresses, context.token]);

  useEffect(() => {
    if (!defaultAddress) {
      setSelectedAddressId('');
      return;
    }

    const deliveryInfo = AddressBookUtil.toDeliveryInfo(defaultAddress, context.customer);
    setSelectedAddressId(String(defaultAddress._id || ''));
    setForm((prevState) => ({
      ...prevState,
      ...deliveryInfo,
      note: prevState.note
    }));
  }, [context.customer, defaultAddress]);

  if (context.token === '') {
    return <Navigate replace to="/login" />;
  }

  if (context.mycart.length === 0 && !completedOrder) {
    return <Navigate replace to="/mycart" />;
  }

  const handleFieldChange = (field, value) => {
    setForm((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleSelectAddress = (address) => {
    const deliveryInfo = AddressBookUtil.toDeliveryInfo(address, context.customer);
    setSelectedAddressId(String(address._id || ''));
    setForm((prevState) => ({
      ...prevState,
      ...deliveryInfo,
      note: prevState.note
    }));
  };

  const handleSelectPaymentMethod = (method) => {
    if (!method.available) {
      window.alert(`${method.label} đang cập nhật.`);
      return;
    }

    setForm((prevState) => ({ ...prevState, paymentMethod: method.value }));
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
          selectedAddressId,
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

      window.alert(result?.message || 'Đặt hàng thành công.');
      setCompletedOrder(true);
      navigate('/checkout/success', {
        replace: true,
        state: {
          deferredPayment: false,
          paymentMethod: form.paymentMethod,
          orderTotal: Number(result?.order?.total) || 0
        }
      });
      context.setMycart([]);
      context.setAppliedVoucher(null);
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

            {addresses.length > 0 ? (
              <div className="checkout-address-book">
                {addresses.map((address) => (
                  <button
                    key={address._id}
                    type="button"
                    className={`checkout-address-card ${selectedAddressId === String(address._id || '') ? 'is-active' : ''}`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <div className="checkout-address-card__head">
                      <strong>{AddressBookUtil.buildFullName(address, context.customer)}</strong>
                      {address.isDefault ? <em>Địa chỉ mặc định</em> : null}
                    </div>
                    <span>{AddressBookUtil.buildAddressText(address)}</span>
                    <span>{address.phone || context.customer?.phone}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="checkout-inline-note">
                Bạn chưa có địa chỉ mặc định. Hãy nhập tay hoặc thêm địa chỉ trong mục tài khoản để lần sau hệ thống tự điền sẵn.
              </div>
            )}

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
                  className={`payment-method-item ${form.paymentMethod === method.value ? 'is-active' : ''} ${method.available ? '' : 'is-disabled'}`.trim()}
                  onClick={() => handleSelectPaymentMethod(method)}
                  disabled={!method.available}
                >
                  <span className="payment-method-item__radio" />
                  <span className="payment-method-item__content">
                    <strong>{method.label}</strong>
                    <small>{method.description}</small>
                  </span>
                  {!method.available ? <span className="payment-method-item__badge">Đang cập nhật</span> : null}
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

export default StoreCheckoutV2;
