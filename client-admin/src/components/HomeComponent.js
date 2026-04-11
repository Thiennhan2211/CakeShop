import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Home extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      customers: [],
      totalProducts: 0,
      monthFrom: '',
      monthTo: ''
    };
  }

  componentDidMount() {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    this.setState(
      {
        monthFrom: this.toMonthInput(previous),
        monthTo: this.toMonthInput(now)
      },
      () => this.apiLoadDashboard()
    );
  }

  toMonthInput(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }

  getMonthRange() {
    if (!this.state.monthFrom || !this.state.monthTo) {
      return [];
    }

    const startDate = new Date(`${this.state.monthFrom}-01T00:00:00`);
    const endDate = new Date(`${this.state.monthTo}-01T00:00:00`);
    const months = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cursor <= endDate) {
      months.push({
        key: `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, '0')}`,
        label: `Tháng ${cursor.getMonth() + 1}/${cursor.getFullYear()}`
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }

  getFilteredOrders() {
    return this.state.orders.filter((order) => {
      const orderDate = new Date(order.cdate);
      const orderMonth = `${orderDate.getFullYear()}-${`${orderDate.getMonth() + 1}`.padStart(2, '0')}`;

      if (this.state.monthFrom && orderMonth < this.state.monthFrom) {
        return false;
      }

      if (this.state.monthTo && orderMonth > this.state.monthTo) {
        return false;
      }

      return true;
    });
  }

  getApprovedOrders() {
    return this.getFilteredOrders().filter((order) => order.status === 'APPROVED');
  }

  getMonthlyRevenue() {
    const approvedOrders = this.getApprovedOrders();
    const revenueMap = {};

    approvedOrders.forEach((order) => {
      const orderDate = new Date(order.cdate);
      const monthKey = `${orderDate.getFullYear()}-${`${orderDate.getMonth() + 1}`.padStart(2, '0')}`;
      revenueMap[monthKey] = (revenueMap[monthKey] || 0) + order.total;
    });

    return this.getMonthRange().map((month) => ({
      label: month.label,
      value: revenueMap[month.key] || 0
    }));
  }

  getTopProducts() {
    const productMap = {};

    this.getApprovedOrders().forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product._id;
        if (!productMap[key]) {
          productMap[key] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
            image: item.product.image // <--- BẠN THÊM DÒNG NÀY VÀO ĐÂY
          };
        }
        productMap[key].quantity += item.quantity;
        productMap[key].revenue += item.product.price * item.quantity;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  formatCurrency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`;
  }

  render() {
    const filteredOrders = this.getFilteredOrders();
    const approvedOrders = this.getApprovedOrders();
    const monthlyRevenue = this.getMonthlyRevenue();
    const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.value), 1);
    const chartWidth = 760;
    const chartHeight = 320;
    const chartPadding = 36;
    const chartBaseline = chartHeight - chartPadding;
    const chartInnerHeight = chartHeight - (chartPadding * 2);
    const chartInnerWidth = chartWidth - (chartPadding * 2);
    const chartPoints = monthlyRevenue.map((item, index) => {
      const x = monthlyRevenue.length === 1
        ? chartWidth / 2
        : chartPadding + ((chartInnerWidth / (monthlyRevenue.length - 1)) * index);
      const y = chartBaseline - ((item.value / maxRevenue) * chartInnerHeight);
      return { ...item, x, y };
    });
    const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = chartPoints.length > 0
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartBaseline} L ${chartPoints[0].x} ${chartBaseline} Z`
      : '';
    const pendingOrders = filteredOrders.filter((order) => order.status === 'PENDING').slice(0, 6);
    const topProducts = this.getTopProducts();
    const totalRevenue = approvedOrders.reduce((sum, order) => sum + order.total, 0);

    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <span className="admin-page__eyebrow">Dashboard</span>
            <h2>Quản lý cửa hàng</h2>
          </div>

          <div className="admin-filter-bar">
            <label>
              Từ tháng
              <input
                type="month"
                value={this.state.monthFrom}
                onChange={(e) => this.setState({ monthFrom: e.target.value })}
              />
            </label>
            <label>
              Đến tháng
              <input
                type="month"
                value={this.state.monthTo}
                onChange={(e) => this.setState({ monthTo: e.target.value })}
              />
            </label>
          </div>
        </header>

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Doanh thu</span>
            <strong>{this.formatCurrency(totalRevenue)}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Số đơn hàng</span>
            <strong>{filteredOrders.length}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Số khách hàng</span>
            <strong>{this.state.customers.length}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Số sản phẩm</span>
            <strong>{this.state.totalProducts}</strong>
          </article>
        </section>

        <section className="admin-dashboard-grid">
          <article className="admin-panel admin-panel--chart">
            <div className="admin-section-heading">
              <div>
                <span className="admin-page__eyebrow">Revenue</span>
                <h3>Biểu đồ doanh thu theo tháng</h3>
              </div>
            </div>

            <div className="admin-line-chart">
              {monthlyRevenue.length > 0 ? (
                <>
                  <svg
                    className="admin-line-chart__svg"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                    aria-label="Biểu đồ doanh thu theo tháng"
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                      const y = chartBaseline - (chartInnerHeight * step);

                      return (
                        <line
                          key={step}
                          x1={chartPadding}
                          y1={y}
                          x2={chartWidth - chartPadding}
                          y2={y}
                          className="admin-line-chart__grid"
                        />
                      );
                    })}

                    {chartPoints.length > 0 ? <path d={areaPath} className="admin-line-chart__area" /> : null}
                    {chartPoints.length > 0 ? <path d={linePath} className="admin-line-chart__path" /> : null}

                    {chartPoints.map((point) => (
                      <circle
                        key={point.label}
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        className="admin-line-chart__point"
                      />
                    ))}
                  </svg>

                  <div className="admin-line-chart__labels">
                    {monthlyRevenue.map((item) => (
                      <span key={item.label}>{item.label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="admin-empty-state">Chưa có dữ liệu doanh thu trong khoảng lọc.</div>
              )}
            </div>

            <div className="admin-chart">
              {monthlyRevenue.length > 0 ? (
                monthlyRevenue.map((item) => (
                  <div key={item.label} className="admin-chart__column">
                    <div
                      className="admin-chart__bar"
                      style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">Chưa có dữ liệu doanh thu trong khoảng lọc.</div>
              )}
            </div>
          </article>

          <article className="admin-panel admin-panel--side">
            <div className="admin-section-heading">
              <div>
                <span className="admin-page__eyebrow">Pending</span>
                <h3>Đơn hàng đang cần duyệt</h3>
              </div>
            </div>

            <div className="admin-list-stack">
              {pendingOrders.length > 0 ? (
                pendingOrders.map((order) => (
                  <div key={order._id} className="admin-mini-card">
                    <strong>{order.customer.name}</strong>
                    <span>{this.formatCurrency(order.total)}</span>
                    <small>{new Date(order.cdate).toLocaleDateString('vi-VN')}</small>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">Không có đơn chờ duyệt.</div>
              )}
            </div>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-section-heading">
            <div>
              <span className="admin-page__eyebrow">Best sellers</span>
              <h3>Sản phẩm bán chạy</h3>
            </div>
          </div>

          <div className="admin-best-grid">
            {topProducts.length > 0 ? (
              topProducts.map((product) => (
                <div key={product.name} className="admin-best-card">
                  <img src={"data:image/jpeg;base64," + product.image} alt={product.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px' }} />
                  <strong>{product.name}</strong>
                  <span>{product.quantity} sản phẩm</span>
                  <small>{this.formatCurrency(product.revenue)}</small>
                </div>
              ))
            ) : (
              <div className="admin-empty-state">Chưa có dữ liệu bán chạy.</div>
            )}
          </div>
        </section>
      </div>
    );
  }

  apiLoadDashboard() {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    Promise.all([
      axios.get('/api/admin/orders', config),
      axios.get('/api/admin/customers', config),
      axios.get('/api/admin/products?page=1', config)
    ]).then(([ordersRes, customersRes, productsRes]) => {
      const productResult = productsRes.data;
      this.setState({
        orders: ordersRes.data,
        customers: customersRes.data,
        totalProducts: productResult.totalProducts || 0
      });
    });
  }
}

export default Home;
