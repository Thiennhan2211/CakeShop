import axios from 'axios';
import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import ProductCollection from './StoreProductCollectionComponent';
import StorefrontUtil from '../utils/StorefrontHelper';
import PageIntro from './PageIntroComponent';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newprods: [],
      hotprods: []
    };
  }

  render() {
    const heroProducts = [...this.state.newprods, ...this.state.hotprods]
      .filter((item, index, list) => {
        return list.findIndex((product) => product._id === item._id) === index;
      })
      .slice(0, 3);

    return (
      <div className="content-page">
        <PageIntro
          title="Trang chủ"
          breadcrumbs={[{ label: 'Trang chủ' }]}
          showBanner={false}
        />

        <section className="hero-banner">
          <div className="hero-banner__copy">
            <span className="section-heading__eyebrow">{StorefrontUtil.brandTagline}</span>
            <h1>Bánh kem thanh lịch cho những dịp thật đẹp</h1>
            <div className="hero-banner__actions">
              <Link to="/product/search/Bánh" className="primary-button">
                Xem bộ sưu tập
              </Link>
              <Link to="/contact" className="soft-button">
                Liên hệ tư vấn
              </Link>
            </div>
          </div>

          <div className="hero-banner__visual">
            {heroProducts.map((item, index) => (
              <div key={item._id} className={`hero-banner__card hero-banner__card--${index + 1}`}>
                <img
                  src={`data:image/jpg;base64,${item.image}`}
                  alt={item.name}
                />
                <div>
                  <strong>{item.name}</strong>
                  <span>{StorefrontUtil.formatCurrency(item.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ProductCollection
          title="Sản phẩm mới"
          subtitle="Mới ra lò"
          products={this.state.newprods}
          emptyMessage="Hiện chưa có sản phẩm mới."
        />

        {this.state.hotprods.length > 0 ? (
          <ProductCollection
            title="Được nhiều khách hàng yêu thích"
            subtitle="Best seller"
            products={this.state.hotprods}
            emptyMessage="Chưa có sản phẩm nổi bật."
            sectionClassName="showcase-section--accent"
          />
        ) : null}
      </div>
    );
  }

  componentDidMount() {
    this.apiGetNewProducts();
    this.apiGetHotProducts();
  }

  apiGetNewProducts() {
    axios.get('/api/customer/products/new').then((res) => {
      const result = res.data;
      this.setState({ newprods: result });
    });
  }

  apiGetHotProducts() {
    axios.get('/api/customer/products/hot').then((res) => {
      const result = res.data;
      this.setState({ hotprods: result });
    });
  }
}

export default Home;
