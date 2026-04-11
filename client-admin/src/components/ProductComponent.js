import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ProductDetail from './ProductDetailComponent';

class Product extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      products: [],
      noPages: 0,
      curPage: 1,
      itemSelected: null
    };
  }

  render() {
    const prods = this.state.products.map((item) => {
      return (
        <tr
          key={item._id}
          className={this.state.itemSelected?._id === item._id ? 'admin-table__row is-active' : 'admin-table__row'}
          onClick={() => this.trItemClick(item)}
        >
          <td>{item._id}</td>
          <td>{item.name}</td>
          <td>{new Intl.NumberFormat('vi-VN').format(item.price)} đ</td>
          <td>{new Date(item.cdate).toLocaleString()}</td>
          <td>{item.category.name}</td>
          <td>{Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes.join(' / ') : 'Chưa chọn'}</td>
          <td>
            <img
              src={'data:image/jpg;base64,' + item.image}
              className="admin-table__image"
              alt={item.name}
            />
          </td>
        </tr>
      );
    });

    const pagination = Array.from(
      { length: this.state.noPages },
      (_, index) => {
        if (index + 1 === this.state.curPage) {
          return (
            <span key={index} className="admin-page-chip is-active">
              {index + 1}
            </span>
          );
        } else {
          return (
            <span
              key={index}
              className="admin-page-chip"
              onClick={() => this.lnkPageClick(index + 1)}
            >
              {index + 1}
            </span>
          );
        }
      }
    );

    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <span className="admin-page__eyebrow">Product</span>
            <h2>Quản lý sản phẩm</h2>
          </div>
        </header>

        <div className="admin-split-layout">
          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="admin-page__eyebrow">List</span>
                <h3>Danh sách sản phẩm</h3>
              </div>
              <div className="admin-pagination">{pagination}</div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Creation date</th>
                    <th>Category</th>
                    <th>Sizes</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>{prods}</tbody>
              </table>
            </div>
          </section>

          <ProductDetail item={this.state.itemSelected} curPage={this.state.curPage} updateProducts={this.updateProducts} />
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.apiGetProducts(this.state.curPage);
  }

  // event handlers
  lnkPageClick(index) {
    this.apiGetProducts(index);
  }

  trItemClick(item) {
    this.setState({ itemSelected: item });
  }
  updateProducts = (products, noPages) => { // arrow function
    this.setState({
      products: products,
      noPages: noPages
    });
  };

  // apis
  apiGetProducts(page) {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios
      .get('/api/admin/products?page=' + page, config)
      .then((res) => {
        const result = res.data;
        this.setState({
          products: result.products,
          noPages: result.noPages,
          curPage: result.curPage
        });
      });
  }
}

export default Product;
