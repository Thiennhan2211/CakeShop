import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageIntro from './PageIntroComponent';
import StoreProductCollection from './StoreProductCollectionComponent';
import StorefrontHelper from '../utils/StorefrontHelper';

const FEATURED_LIMIT = 3;
const SPOTLIGHT_LIMIT = 4;

const extractProducts = (result, limit) => {
  if (result.status !== 'fulfilled') {
    return [];
  }

  const products = Array.isArray(result.value?.data) ? result.value.data : [];
  return products.slice(0, limit);
};

function StoreHome() {
  const [newProducts, setNewProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [tiramisuProducts, setTiramisuProducts] = useState([]);
  const [mousseProducts, setMousseProducts] = useState([]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([
      axios.get('/api/customer/products/new'),
      axios.get('/api/customer/products/hot'),
      axios.get(`/api/customer/products/search/${encodeURIComponent('tiramisu')}`),
      axios.get(`/api/customer/products/search/${encodeURIComponent('mousse')}`)
    ]).then((results) => {
      if (ignore) {
        return;
      }

      const [newResult, hotResult, tiramisuResult, mousseResult] = results;
      setNewProducts(extractProducts(newResult, FEATURED_LIMIT));
      setHotProducts(extractProducts(hotResult, FEATURED_LIMIT));
      setTiramisuProducts(extractProducts(tiramisuResult, SPOTLIGHT_LIMIT));
      setMousseProducts(extractProducts(mousseResult, SPOTLIGHT_LIMIT));
    });

    return () => {
      ignore = true;
    };
  }, []);

  const heroProducts = useMemo(() => {
    return [...newProducts, ...hotProducts]
      .filter((item, index, list) => list.findIndex((product) => product._id === item._id) === index)
      .slice(0, 3);
  }, [hotProducts, newProducts]);

  return (
    <div className="content-page">
      <PageIntro
        title="Trang chủ"
        breadcrumbs={[{ label: 'Trang chủ' }]}
        showBanner={false}
      />

      <section className="hero-banner">
        <div className="hero-banner__copy">
          <span className="section-heading__eyebrow">{StorefrontHelper.brandTagline}</span>
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
              <img src={`data:image/jpg;base64,${item.image}`} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <span>{StorefrontHelper.formatCurrency(item.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <StoreProductCollection
        title="Sản phẩm mới"
        subtitle="Mới ra lò"
        products={newProducts}
        emptyMessage="Hiện chưa có sản phẩm mới."
      />

      {hotProducts.length > 0 ? (
        <StoreProductCollection
          title="Được nhiều khách hàng yêu thích"
          subtitle="Best seller"
          products={hotProducts}
          emptyMessage="Chưa có sản phẩm nổi bật."
          sectionClassName="showcase-section--accent"
        />
      ) : null}

      {tiramisuProducts.length > 0 ? (
        <StoreProductCollection
          title="Bánh tiramisu"
          subtitle="Đậm vị, mềm mịn"
          products={tiramisuProducts}
          emptyMessage="Hiện chưa có dòng bánh tiramisu."
        />
      ) : null}

      {mousseProducts.length > 0 ? (
        <StoreProductCollection
          title="Bánh mousse"
          subtitle="Thanh mát, nhẹ nhàng"
          products={mousseProducts}
          emptyMessage="Hiện chưa có dòng bánh mousse."
          sectionClassName="showcase-section--accent"
        />
      ) : null}
    </div>
  );
}

export default StoreHome;
