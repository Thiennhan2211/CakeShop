import axios from 'axios';
import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import StorefrontUtil from '../utils/StorefrontUtil';
import PageIntro from './PageIntroComponent';

class Myorders extends Component {
  static contextType = MyContext; // using this.context to access global state

  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      order: null
    };
  }

  render() {
    if (this.context.token === '') return (<Navigate replace to="/login" />);

    const orders = this.state.orders.map((item) => {
      return (
        <button
          key={item._id}
          type="button"
          className={`order-list-card ${this.state.order?._id === item._id ? 'is-active' : ''}`}
          onClick={() => this.trItemClick(item)}
        >
          <span>{new Date(item.cdate).toLocaleDateString('vi-VN')}</span>
          <strong>{StorefrontUtil.formatCurrency(item.total)}</strong>
          <p>{item.status}</p>
        </button>
      );
    });

    const items = this.state.order ? this.state.order.items.map((item, index) => (
      <div key={`${item.product._id}-${index}`} className="order-detail-item">
        <img
          src={`data:image/jpg;base64,${item.product.image}`}
          alt={item.product.name}
        />
        <div>
          <strong>{item.product.name}</strong>
          {item.size ? <p>Size: {item.size}</p> : null}
          <p>Số lượng: {item.quantity}</p>
        </div>
        <span>{StorefrontUtil.formatCurrency(item.product.price * item.quantity)}</span>
      </div>
    )) : null;

    return (
      <div className="content-page">
        <PageIntro
          title="Đơn hàng của tôi"
          eyebrow="Cake House"
          breadcrumbs={[{ label: 'Trang chủ', to: '/home' }, { label: 'Tài khoản', to: '/myprofile' }, { label: 'Đơn hàng' }]}
        />

        <section className="account-split-layout">
          <div className="account-split-layout__panel">
            <div className="section-heading">
              <div>
                <span className="section-heading__eyebrow">Lịch sử mua hàng</span>
                <h2>Đơn hàng của tôi</h2>
              </div>
              <span className="section-heading__line" />
            </div>
            <div className="order-list">{orders}</div>
          </div>

          <div className="account-split-layout__panel">
            {this.state.order ? (
              <>
                <span className="section-heading__eyebrow">Chi tiết đơn</span>
                <h2>{this.state.order._id}</h2>
                <p>Trạng thái: {this.state.order.status}</p>
                <p>Tổng tiền: {StorefrontUtil.formatCurrency(this.state.order.total)}</p>
                <div className="order-detail-list">{items}</div>
              </>
            ) : (
              <div className="empty-state-card">Chọn một đơn hàng để xem chi tiết.</div>
            )}
          </div>
        </section>
      </div>
    );
  }

  componentDidMount() {
    if (this.context.customer) {
      const cid = this.context.customer._id;
      this.apiGetOrdersByCustID(cid);
    }
  }

  // event-handlers
  trItemClick(item) {
    this.setState({ order: item });
  }

  // apis
  apiGetOrdersByCustID(cid) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/customer/orders/customer/' + cid, config).then((res) => {
      const result = res.data;
      this.setState({ orders: result, order: result[0] || null });
    });
  }
}

export default Myorders;
