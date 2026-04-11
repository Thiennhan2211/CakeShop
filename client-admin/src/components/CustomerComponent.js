import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Customer extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      customers: [],
      allOrders: [],
      customer: null,
      orders: [],
      loadingCustomerDetail: false
    };
  }

  componentDidMount() {
    this.apiGetDataLoad();
  }

  formatCurrency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`;
  }

  normalizeId(value) {
    return value ? value.toString() : '';
  }

  buildCustomerFullName(address = {}, customer = {}) {
    const fullName = [address.lastName, address.firstName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || customer.name || 'Khách hàng Cake House';
  }

  buildAddressText(address = {}) {
    return [
      address.addressLine1,
      address.ward,
      address.district,
      address.province
    ]
      .filter(Boolean)
      .join(', ');
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

  fetchAllOrderSummaries(config) {
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

  fetchOrdersByCustomer(cid, config) {
    return axios.get('/api/admin/orders/customer/' + cid + '/summary', config).then((res) => {
      return Array.isArray(res.data) ? res.data : [];
    }).catch((error) => {
      if (error?.response?.status !== 404) {
        throw error;
      }

      return axios.get('/api/admin/orders/customer/' + cid, config).then((res) => {
        return (Array.isArray(res.data) ? res.data : []).map((item) => this.buildOrderSummary(item));
      }).catch((customerOrdersError) => {
        if (customerOrdersError?.response?.status !== 404) {
          throw customerOrdersError;
        }

        return axios.get('/api/admin/orders', config).then((res) => {
          return (Array.isArray(res.data) ? res.data : [])
            .filter((item) => this.normalizeId(item.customer?._id) === this.normalizeId(cid))
            .map((item) => this.buildOrderSummary(item));
        });
      });
    });
  }

  fetchCustomerDetail(cid, config) {
    return axios.get('/api/admin/customers/' + cid, config).then((res) => {
      return res.data || null;
    }).catch((error) => {
      if (error?.response?.status === 404) {
        return null;
      }

      throw error;
    });
  }

  trCustomerClick(item) {
    this.setState({ customer: item, orders: [], loadingCustomerDetail: true });
    this.apiGetCustomerDetail(item._id, item);
    this.apiGetOrdersByCustID(item._id);
  }

  lnkDeactiveClick(item) {
    this.apiPutCustomerDeactive(item._id, item.token);
  }

  lnkEmailClick(item) {
    this.apiGetCustomerSendmail(item._id);
  }

  apiGetDataLoad() {
    const config = { headers: { 'x-access-token': this.context.token } };

    Promise.all([
      axios.get('/api/admin/customers', config),
      this.fetchAllOrderSummaries(config)
    ]).then(([customersRes, orders]) => {
      this.setState({
        customers: Array.isArray(customersRes.data) ? customersRes.data : [],
        allOrders: Array.isArray(orders) ? orders : []
      });
    }).catch(() => {
      this.setState({ customers: [], allOrders: [] });
      window.alert('Không thể tải dữ liệu khách hàng.');
    });
  }

  apiGetOrdersByCustID(cid) {
    const config = { headers: { 'x-access-token': this.context.token } };
    this.fetchOrdersByCustomer(cid, config).then((orders) => {
      this.setState({ orders: Array.isArray(orders) ? orders : [] });
    }).catch(() => {
      this.setState({ orders: [] });
      window.alert('Không thể tải lịch sử đơn hàng của khách hàng này.');
    });
  }

  apiGetCustomerDetail(cid, fallbackCustomer = null) {
    const config = { headers: { 'x-access-token': this.context.token } };
    this.fetchCustomerDetail(cid, config).then((customer) => {
      this.setState({
        customer: customer || fallbackCustomer,
        loadingCustomerDetail: false
      });
    }).catch(() => {
      this.setState({
        customer: fallbackCustomer,
        loadingCustomerDetail: false
      });
      window.alert('Không thể tải thông tin chi tiết khách hàng.');
    });
  }

  apiPutCustomerDeactive(id, token) {
    const body = { token };
    const config = { headers: { 'x-access-token': this.context.token } };

    axios.put('/api/admin/customers/deactive/' + id, body, config).then((res) => {
      if (res.data) {
        this.apiGetDataLoad();
      } else {
        window.alert('Không thể khóa tài khoản này.');
      }
    }).catch(() => {
      window.alert('Không thể khóa tài khoản này.');
    });
  }

  apiGetCustomerSendmail(id) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/customers/sendmail/' + id, config).then((res) => {
      window.alert(res.data.message);
    }).catch(() => {
      window.alert('Không thể gửi email lúc này.');
    });
  }

  render() {
    const customers = this.state.customers.map((item) => {
      const customerOrders = this.state.allOrders.filter((order) => {
        return this.normalizeId(order.customer?._id) === this.normalizeId(item._id) && order.status === 'APPROVED';
      });
      const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      let dynamicRank = 'MEMBER';
      if (totalSpent >= 10000000) dynamicRank = 'VIP';
      else if (totalSpent >= 5000000) dynamicRank = 'GOLD';
      else if (totalSpent >= 2000000) dynamicRank = 'SILVER';

      const rankClass = `rank-badge rank-${dynamicRank.toLowerCase()}`;

      return (
        <tr key={item._id} className="admin-table__row" onClick={() => this.trCustomerClick(item)}>
          <td>{String(item._id || '').substring(0, 8)}...</td>
          <td><strong>{item.username}</strong></td>
          <td>{item.name}</td>
          <td>{item.phone}</td>
          <td><span className={rankClass}>{dynamicRank}</span></td>
          <td>
            {item.active === 1 ? <span className="status-badge status-approved">Active</span> : <span className="status-badge status-canceled">Deactive</span>}
          </td>
          <td>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="admin-primary-button" style={{ padding: '5px 10px', minHeight: 'auto' }} onClick={(e) => { e.stopPropagation(); this.lnkEmailClick(item); }}>
                <i className="bi bi-envelope"></i> Gửi Mail
              </button>
              <button className="admin-secondary-button" style={{ padding: '5px 10px', minHeight: 'auto' }} onClick={(e) => { e.stopPropagation(); this.lnkDeactiveClick(item); }}>
                Khóa
              </button>
            </div>
          </td>
        </tr>
      );
    });

    const popupOrders = this.state.orders.map((item) => {
      return (
        <tr key={item._id}>
          <td>{String(item._id || '').substring(0, 8)}...</td>
          <td>{new Date(item.cdate).toLocaleDateString('vi-VN')}</td>
          <td><span className={`status-badge status-${(item.status || 'PENDING').toLowerCase()}`}>{item.status}</span></td>
          <td style={{ color: 'var(--admin-pink-700)', fontWeight: 'bold' }}>{this.formatCurrency(item.total)}</td>
        </tr>
      );
    });

    const popupAddresses = Array.isArray(this.state.customer?.addresses) ? this.state.customer.addresses : [];
    const popupAddressCards = popupAddresses.map((address, index) => {
      return (
        <article
          key={this.normalizeId(address?._id) || `address-${index}`}
          style={{
            padding: '16px',
            borderRadius: '18px',
            border: '1px solid rgba(145, 109, 91, 0.2)',
            background: address?.isDefault ? 'rgba(233, 171, 197, 0.12)' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
            <strong>{this.buildCustomerFullName(address, this.state.customer)}</strong>
            {address?.isDefault ? <span className="status-badge status-approved">Mặc định</span> : null}
          </div>
          <div style={{ color: 'var(--admin-ink-600)', lineHeight: 1.6 }}>
            <div>{this.buildAddressText(address) || 'Chưa có địa chỉ.'}</div>
            <div>{address?.phone || this.state.customer?.phone || 'Chưa có số điện thoại'}</div>
            {address?.company ? <div>{address.company}</div> : null}
          </div>
        </article>
      );
    });

    let popupTotalSpent = 0;
    let popupRank = 'MEMBER';

    if (this.state.customer) {
      popupTotalSpent = this.state.orders.reduce((sum, order) => {
        if (order.status === 'APPROVED') {
          return sum + (Number(order.total) || 0);
        }
        return sum;
      }, 0);

      if (popupTotalSpent >= 10000000) popupRank = 'VIP';
      else if (popupTotalSpent >= 5000000) popupRank = 'GOLD';
      else if (popupTotalSpent >= 2000000) popupRank = 'SILVER';
    }

    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <span className="admin-page__eyebrow">Customer</span>
            <h2>Quản lý khách hàng</h2>
          </div>
        </header>

        <div className="admin-full-layout">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã KH</th>
                  <th>Username</th>
                  <th>Tên</th>
                  <th>Điện thoại</th>
                  <th>Hạng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>{customers}</tbody>
            </table>
          </div>
        </div>

        {this.state.customer && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content large" style={{ width: '700px' }}>
              <div className="admin-modal-header">
                <h3>Hồ sơ khách hàng</h3>
                <button className="admin-modal-close" onClick={() => this.setState({ customer: null, orders: [], loadingCustomerDetail: false })}>&times;</button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '16px', marginBottom: '30px' }}>
                <div style={{ width: '45%' }}><strong>ID:</strong> {this.state.customer._id}</div>
                <div style={{ width: '45%' }}><strong>Username:</strong> @{this.state.customer.username}</div>
                <div style={{ width: '45%' }}><strong>Họ và tên:</strong> {this.state.customer.name}</div>
                <div style={{ width: '45%' }}><strong>Điện thoại:</strong> {this.state.customer.phone}</div>
                <div style={{ width: '45%' }}><strong>Email:</strong> {this.state.customer.email}</div>
                <div style={{ width: '45%' }}>
                  <strong>Tình trạng:</strong> {this.state.customer.active === 1 ? <span className="status-badge status-approved">Đã kích hoạt</span> : <span className="status-badge status-canceled">Bị khóa</span>}
                </div>

                <div style={{ width: '45%', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                  <strong>Tổng chi tiêu:</strong> <span style={{ color: 'var(--admin-pink-500)', fontSize: '18px', fontWeight: 'bold' }}>{this.formatCurrency(popupTotalSpent)}</span>
                </div>
                <div style={{ width: '45%', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                  <strong>Hạng hiện tại:</strong> <span className={`rank-badge rank-${popupRank.toLowerCase()}`}>{popupRank}</span>
                </div>
              </div>

              <h5>Địa chỉ đã lưu</h5>
              <div style={{ display: 'grid', gap: '12px', marginTop: '12px', marginBottom: '24px' }}>
                {this.state.loadingCustomerDetail ? (
                  <div className="empty-state-card">Đang tải thông tin địa chỉ...</div>
                ) : popupAddressCards.length > 0 ? (
                  popupAddressCards
                ) : (
                  <div className="empty-state-card">Khách hàng này chưa lưu địa chỉ nào.</div>
                )}
              </div>

              <h5>Lịch sử đơn hàng</h5>
              <div className="admin-table-wrap" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="admin-table" style={{ marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th>Mã ĐH</th>
                      <th>Ngày đặt</th>
                      <th>Trạng thái</th>
                      <th>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.orders.length > 0 ? popupOrders : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Khách hàng này chưa có đơn hàng nào.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Customer;
