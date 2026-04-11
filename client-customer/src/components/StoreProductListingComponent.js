import axios from 'axios';
import React, { useEffect, useState } from 'react';
import withRouter from '../utils/withRouter';
import PageIntro from './PageIntroComponent';
import StoreProductCollection from './StoreProductCollectionComponent';

function StoreProductListing({ params }) {
  const [products, setProducts] = useState([]);
  const [heading, setHeading] = useState('Danh mục sản phẩm');
  const [subheading, setSubheading] = useState('Bộ sưu tập');

  useEffect(() => {
    if (params.cid) {
      axios.get(`/api/customer/products/category/${params.cid}`).then((res) => {
        const result = res.data || [];
        setProducts(result);
        setHeading(result[0]?.category?.name || 'Danh mục sản phẩm');
        setSubheading('Danh mục');
      }).catch(() => {
        setProducts([]);
        setHeading('Danh mục sản phẩm');
        setSubheading('Danh mục');
      });
      return;
    }

    if (params.keyword) {
      axios.get(`/api/customer/products/search/${encodeURIComponent(params.keyword)}`).then((res) => {
        setProducts(res.data || []);
        setHeading(`Kết quả cho "${params.keyword}"`);
        setSubheading('Tìm kiếm');
      }).catch(() => {
        setProducts([]);
        setHeading(`Kết quả cho "${params.keyword}"`);
        setSubheading('Tìm kiếm');
      });
      return;
    }

    setProducts([]);
    setHeading('Danh mục sản phẩm');
    setSubheading('Bộ sưu tập');
  }, [params.cid, params.keyword]);

  return (
    <div className="content-page">
      <PageIntro
        title={heading}
        eyebrow={subheading}
        breadcrumbs={[
          { label: 'Trang chủ', to: '/home' },
          params.cid ? { label: heading } : null,
          params.keyword ? { label: `Tìm kiếm: ${params.keyword}` } : null
        ]}
      />

      <StoreProductCollection
        showHeading={false}
        title={heading}
        subtitle={subheading}
        products={products}
        emptyMessage="Không tìm thấy sản phẩm phù hợp."
      />
    </div>
  );
}

export default withRouter(StoreProductListing);
