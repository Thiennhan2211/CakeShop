import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import CartUtil from '../utils/CartUtil';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import StorefrontUtil from '../utils/StorefrontUtil';

class Mycart extends Component {
  static contextType = MyContext; // using this.context to access global state

  render() {
    const mycart = this.context.mycart.map((item) => (
      <article key={`${item.product._id}-${item.size || 'default'}`} className="cart-item-card">
        <img
          src={`data:image/jpg;base64,${item.product.image}`}
          alt={item.product.name}
        />
        <div className="cart-item-card__content">
          <span className="section-heading__eyebrow">{item.product.category.name}</span>
          <h3>{item.product.name}</h3>
          <p>Phiên bản: {item.size || 'Mặc định'}</p>
          <p>Số lượng: {item.quantity}</p>
          <strong>{StorefrontUtil.formatCurrency(item.product.price * item.quantity)}</strong>
        </div>
        <button
          type="button"
          className="soft-button"
          onClick={() => this.lnkRemoveClick(item.product._id, item.size)}
        >
          Xóa
        </button>
      </article>
    ));

    return (
      <div className="content-page">
        <section className="cart-layout">
          <div className="cart-layout__items">
            <div className="section-heading">
              <div>
                <span className="section-heading__eyebrow">Giỏ hàng</span>
                <h2>Sản phẩm đã chọn</h2>
              </div>
              <span className="section-heading__line" />
            </div>
            {mycart.length > 0 ? mycart : <div className="empty-state-card">Giỏ hàng của bạn đang trống.</div>}
          </div>

          <aside className="cart-summary-card">
            <span className="section-heading__eyebrow">Tóm tắt</span>
            <h3>Thông tin đơn hàng</h3>
            <p>Tổng sản phẩm: {this.context.mycart.length}</p>
            <p>Tổng thanh toán:</p>
            <strong>{StorefrontUtil.formatCurrency(CartUtil.getTotal(this.context.mycart))}</strong>
            <button type="button" className="primary-button" onClick={() => this.lnkCheckoutClick()}>
              Tiến hành đặt hàng
            </button>
          </aside>
        </section>
      </div>
    );
  }
  lnkRemoveClick(id, size) {
    const nextCart = CartUtil.removeItem(this.context.mycart, id, size);
    this.context.setMycart(nextCart);
  }
  lnkCheckoutClick() {
    if (window.confirm('ARE YOU SURE?')) {
      if (this.context.mycart.length > 0) {
        const total = CartUtil.getTotal(this.context.mycart);
        const items = this.context.mycart;
        const customer = this.context.customer;

        if (customer) {
          this.apiCheckout(total, items, customer);
        } else {
          this.props.navigate('/login');
        }
      } else {
        alert('Giỏ hàng hiện đang trống.');
      }
    }
  }

  // apis
  apiCheckout(total, items, customer) {
    const body = { total: total, items: items, customer: customer };
    const config = { headers: { 'x-access-token': this.context.token } };

    axios.post('/api/customer/checkout', body, config).then((res) => {
      const result = res.data;
      if (result) {
        alert('Đặt hàng thành công.');
        this.context.setMycart([]);
        this.props.navigate('/home');
      } else {
        alert('Không thể đặt hàng vào lúc này.');
      }
    });
  }
}

export default withRouter(Mycart);
