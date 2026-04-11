import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Order extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      order: null,
      loadingOrder: false
    };
  }

  componentDidMount() {
    this.apiGetOrders();
  }

  formatCurrency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`;
  }

  buildOrderSummary(order = {}) {
    const items = Array.isArray(order.items) ? order.items : [];

    return {
      _id: order._id,
      cdate: order.cdate,
      total: Number(order.total) || 0,
      status: order.status || 'PENDING',
      customer: order.customer || {},
      itemCount: items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
    };
  }

  fetchOrderSummaries(config) {
    return axios.get('/api/admin/orders/summary', config).then((res) => {
      return Array.isArray(res.data) ? res.data : [];
    }).catch((error) => {
      if (error?.response?.status !== 404) {
        throw error;
      }

      return axios.get('/api/admin/orders', config).then((res) => {
        return (Array.isArray(res.data) ? res.data : []).map((item) => this.buildOrderSummary(item));
      });
    });
  }

  fetchOrderDetail(id, config) {
    return axios.get('/api/admin/orders/' + id, config).then((res) => {
      return res.data || null;
    }).catch((error) => {
      if (error?.response?.status !== 404) {
        throw error;
      }

      return axios.get('/api/admin/orders', config).then((res) => {
        return (Array.isArray(res.data) ? res.data : []).find((item) => String(item._id || '') === String(id || '')) || null;
      });
    });
  }

  trItemClick(item) {
    this.apiGetOrderByID(item._id);
  }

  lnkApproveClick(id) {
    this.apiPutOrderStatus(id, 'APPROVED');
  }

  lnkCancelClick(id) {
    this.apiPutOrderStatus(id, 'CANCELED');
  }

  apiPutOrderStatus(id, status) {
    const body = { status };
    const config = { headers: { 'x-access-token': this.context.token } };

    axios.put('/api/admin/orders/status/' + id, body, config).then((res) => {
      const result = res.data;
      if (result) {
        this.apiGetOrders();
        if (this.state.order?._id === id) {
          this.apiGetOrderByID(id);
        }
      } else {
        window.alert('Không thể cập nhật trạng thái đơn hàng.');
      }
    }).catch(() => {
      window.alert('Không thể cập nhật trạng thái đơn hàng.');
    });
  }

  apiGetOrders() {
    const config = { headers: { 'x-access-token': this.context.token } };

    this.fetchOrderSummaries(config).then((orders) => {
      this.setState({ orders });
    }).catch(() => {
      this.setState({ orders: [] });
      window.alert('Không thể tải danh sách đơn hàng.');
    });
  }

  apiGetOrderByID(id) {
    const config = { headers: { 'x-access-token': this.context.token } };

    this.setState({ loadingOrder: true, order: null });
    this.fetchOrderDetail(id, config).then((order) => {
      this.setState({
        order: order,
        loadingOrder: false
      });
    }).catch(() => {
      this.setState({ order: null, loadingOrder: false });
      window.alert('Không thể tải chi tiết đơn hàng.');
    });
  }

  render() {
    const activeOrder = this.state.order;
    const orders = this.state.orders.map((item) => {
      return (
        <tr key={item._id} className="admin-table__row" onClick={() => this.trItemClick(item)}>
          <td>{String(item._id || '').substring(0, 8)}...</td>
          <td>{new Date(item.cdate).toLocaleString('vi-VN')}</td>
          <td><strong>{item.customer?.name}</strong></td>
          <td>{item.customer?.phone}</td>
          <td style={{ color: 'var(--admin-pink-700)', fontWeight: 'bold' }}>{this.formatCurrency(item.total)}</td>
          <td><span className={`status-badge status-${(item.status || 'PENDING').toLowerCase()}`}>{item.status}</span></td>
          <td>
            {item.status === 'PENDING' ? (
              <div style={{ display: 'flex', gap: '5px' }}>
                <button className="admin-primary-button" style={{ padding: '5px 10px', minHeight: 'auto' }} onClick={(e) => { e.stopPropagation(); this.lnkApproveClick(item._id); }}>Duyệt</button>
                <button className="admin-danger-button" style={{ padding: '5px 10px', minHeight: 'auto' }} onClick={(e) => { e.stopPropagation(); this.lnkCancelClick(item._id); }}>Hủy</button>
              </div>
            ) : null}
          </td>
        </tr>
      );
    });

    const items = Array.isArray(activeOrder?.items)
      ? activeOrder.items.map((item, index) => (
          <tr key={`${item.product._id}-${index}`}>
            <td>
              <img
                src={'data:image/jpg;base64,' + item.product.image}
                alt={item.product.name}
                width="50"
                height="50"
                style={{ borderRadius: '8px', objectFit: 'cover' }}
              />
            </td>
            <td>
              <strong>{item.product.name}</strong>
              {item.size ? <div style={{ marginTop: '6px', color: 'var(--admin-muted)' }}>Size: {item.size}</div> : null}
              {item.note ? <div style={{ marginTop: '6px', color: 'var(--admin-pink-700)' }}>Lời nhắn: {item.note}</div> : null}
            </td>
            <td>{this.formatCurrency(item.product.price)}</td>
            <td>x{item.quantity}</td>
            <td style={{ color: 'var(--admin-pink-700)' }}>{this.formatCurrency(item.product.price * item.quantity)}</td>
          </tr>
        ))
      : null;

    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <span className="admin-page__eyebrow">Order</span>
            <h2>Quản lý đơn hàng</h2>
          </div>
        </header>

        <div className="admin-full-layout">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Ngày đặt</th>
                  <th>Khách hàng</th>
                  <th>Điện thoại</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>{orders}</tbody>
            </table>
          </div>
        </div>

        {(this.state.loadingOrder || activeOrder) ? (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content large">
              <div className="admin-modal-header">
                <h3>Chi tiết đơn hàng: <span style={{ color: 'var(--admin-pink-500)' }}>#{activeOrder?._id || '...'}</span></h3>
                <button className="admin-modal-close" onClick={() => this.setState({ order: null, loadingOrder: false })}>&times;</button>
              </div>

              {this.state.loadingOrder || !activeOrder ? (
                <div className="admin-empty-state" style={{ marginTop: '12px' }}>Đang tải chi tiết đơn hàng...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '16px' }}>
                    <div>
                      <p><strong>Khách hàng:</strong> {activeOrder.customer?.name}</p>
                      <p><strong>SĐT:</strong> {activeOrder.customer?.phone}</p>
                      {activeOrder.deliveryInfo?.address ? <p><strong>Địa chỉ:</strong> {activeOrder.deliveryInfo.address}</p> : null}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p><strong>Ngày đặt:</strong> {new Date(activeOrder.cdate).toLocaleString('vi-VN')}</p>
                      <p><strong>Trạng thái:</strong> <span className={`status-badge status-${(activeOrder.status || 'PENDING').toLowerCase()}`}>{activeOrder.status}</span></p>
                    </div>
                  </div>

                  {activeOrder.deliveryInfo?.note ? (
                    <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', background: 'var(--admin-pink-50)' }}>
                      <strong>Ghi chú đơn hàng:</strong> {activeOrder.deliveryInfo.note}
                    </div>
                  ) : null}

                  <h5>Danh sách bánh đã đặt</h5>
                  <table className="admin-table" style={{ marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th>Hình ảnh</th>
                        <th>Tên bánh</th>
                        <th>Đơn giá</th>
                        <th>SL</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>{items}</tbody>
                  </table>

                  <div style={{ textAlign: 'right', marginTop: '20px' }}>
                    <h4>Tổng cộng: <span style={{ color: 'var(--admin-pink-500)' }}>{this.formatCurrency(activeOrder.total)}</span></h4>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default Order;
