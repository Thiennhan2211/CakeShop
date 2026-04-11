import axios from 'axios';
import React, { Component } from 'react';
import withRouter from '../utils/withRouter';
import ProductCollection from './StoreProductCollectionComponent';
import PageIntro from './PageIntroComponent';

class Product extends Component {
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      heading: 'Danh mục sản phẩm',
      subheading: 'Bộ sưu tập'
    };
  }

  render() {
    return (
      <div className="content-page">
        <PageIntro
          title={this.state.heading}
          eyebrow={this.state.subheading}
          breadcrumbs={[
            { label: 'Trang chủ', to: '/home' },
            this.props.params.cid ? { label: this.state.heading } : null,
            this.props.params.keyword ? { label: `Tìm kiếm: ${this.props.params.keyword}` } : null
          ]}
        />

        <ProductCollection
          showHeading={false}
          title={this.state.heading}
          subtitle={this.state.subheading}
          products={this.state.products}
          emptyMessage="Không tìm thấy sản phẩm phù hợp."
        />
      </div>
    );
  }

  componentDidMount() {
    this.loadData(this.props.params);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.params.cid !== prevProps.params.cid ||
      this.props.params.keyword !== prevProps.params.keyword
    ) {
      this.loadData(this.props.params);
    }
  }

  loadData(params) {
    if (params.cid) {
      this.apiGetProductsByCatID(params.cid);
      return;
    }

    if (params.keyword) {
      this.apiGetProductsByKeyword(params.keyword);
    }
  }

  apiGetProductsByCatID(cid) {
    axios
      .get('/api/customer/products/category/' + cid)
      .then((res) => {
        const result = res.data;
        this.setState({
          products: result,
          heading: result[0]?.category?.name || 'Danh mục sản phẩm',
          subheading: 'Danh mục'
        });
      });
  }

  apiGetProductsByKeyword(keyword) {
    axios
      .get('/api/customer/products/search/' + keyword)
      .then((res) => {
        const result = res.data;
        this.setState({
          products: result,
          heading: `Kết quả cho "${keyword}"`,
          subheading: 'Tìm kiếm'
        });
      });
  }
}

export default withRouter(Product);
