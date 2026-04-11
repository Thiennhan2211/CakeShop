import axios from 'axios';
import React, { Component } from 'react';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import ProductCollection from './ProductCollectionComponent';
import PageIntro from './PageIntroComponent';
import CartUtil from '../utils/CartUtil';
import StorefrontUtil from '../utils/StorefrontUtil';

class ProductDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      product: null,
      txtQuantity: 1,
      selectedSize: '',
      cakeMessage: '',
      relatedProducts: [],
      activeTab: 'description'
    };
  }

  getFinalPrice() {
    return StorefrontUtil.getPriceBySize(this.state.product, this.state.selectedSize);
  }

  render() {
    const prod = this.state.product;

    if (!prod) {
      return <div />;
    }

    const productStory = StorefrontUtil.buildProductStory(prod);
    const highlights = StorefrontUtil.buildProductHighlights(prod);
    const sizeOptions = StorefrontUtil.normalizeSizes(prod.sizes);
    const finalPrice = this.getFinalPrice();
    const showCakeMessageInput = StorefrontUtil.shouldShowCakeMessageInput(prod);
    const breadcrumbs = [
      { label: 'Trang chủ', to: '/home' },
      prod.category?.name ? { label: prod.category.name, to: `/product/category/${prod.category._id}` } : null,
      { label: prod.name }
    ];

    return (
      <div className="content-page">
        <PageIntro
          title={prod.name}
          eyebrow={prod.category?.name || 'Sản phẩm'}
          breadcrumbs={breadcrumbs}
        />

        <section className="product-detail-shell">
          <div className="product-detail-shell__media">
            <div className="product-detail-card">
              <img
                src={`data:image/jpg;base64,${prod.image}`}
                alt={prod.name}
              />
            </div>
          </div>

          <div className="product-detail-shell__content">
            <span className="section-heading__eyebrow">{prod.category.name}</span>
            <h1>{prod.name}</h1>
            <strong className="product-detail__price">
              {StorefrontUtil.formatCurrency(finalPrice)}
            </strong>
            <div className="product-detail__lead">{productStory[0]}</div>

            <div className="detail-highlight-list">
              {highlights.map((item) => (
                <div key={item} className="detail-highlight-item">
                  {item}
                </div>
              ))}
            </div>

            {sizeOptions.length > 0 ? (
              <div className="detail-choice-group">
                <label>Chọn size</label>
                <div className="product-modal__sizes">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-pill ${this.state.selectedSize === size ? 'is-active' : ''}`}
                      onClick={() => this.setState({ selectedSize: size })}
                    >
                      Size {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="product-warning-note">
              {StorefrontUtil.getPreparationNotice()}
            </div>

            {showCakeMessageInput ? (
              <div className="detail-choice-group">
                <label>Lời nhắn gửi</label>
                <textarea
                  className="cake-message-input"
                  rows="3"
                  value={this.state.cakeMessage}
                  placeholder={StorefrontUtil.getCakeMessagePlaceholder()}
                  onChange={(event) => this.setState({ cakeMessage: event.target.value })}
                />
              </div>
            ) : null}

            <div className="detail-choice-group">
              <label>Số lượng</label>
              <div className="product-modal__quantity">
                <button
                  type="button"
                  onClick={() => this.setState({ txtQuantity: Math.max(1, Number(this.state.txtQuantity) - 1) })}
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={this.state.txtQuantity}
                  onChange={(event) => {
                    this.setState({
                      txtQuantity: Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1)
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() => this.setState({ txtQuantity: Number(this.state.txtQuantity) + 1 })}
                >
                  +
                </button>
              </div>
            </div>

            <div className="hero-banner__actions">
              <button
                type="button"
                className="primary-button"
                onClick={(event) => this.btnAdd2CartClick(event)}
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </section>

        <section className="detail-tab-card">
          <div className="detail-tab-card__tabs">
            <button
              type="button"
              className={this.state.activeTab === 'description' ? 'is-active' : ''}
              onClick={() => this.setState({ activeTab: 'description' })}
            >
              Mô tả
            </button>
            <button
              type="button"
              className={this.state.activeTab === 'info' ? 'is-active' : ''}
              onClick={() => this.setState({ activeTab: 'info' })}
            >
              Thông tin bổ sung
            </button>
          </div>

          {this.state.activeTab === 'description' ? (
            <div className="detail-tab-card__content detail-tab-card__content--list">
              {productStory.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ) : (
            <div className="detail-tab-card__content detail-tab-card__content--list">
              <span>Mã sản phẩm: {prod._id}</span>
              <span>Danh mục: {prod.category.name}</span>
              <span>Khoảng giá hiện tại: {StorefrontUtil.formatCurrency(finalPrice)}</span>
              {sizeOptions.length > 0 ? <span>Size bán ra: {sizeOptions.join(' / ')}</span> : null}
            </div>
          )}
        </section>

        <ProductCollection
          title="Sản phẩm tương tự"
          subtitle="Gợi ý cùng danh mục"
          products={this.state.relatedProducts}
          emptyMessage="Chưa có sản phẩm tương tự."
        />
      </div>
    );
  }

  componentDidMount() {
    this.apiGetProduct(this.props.params.slug);
  }

  componentDidUpdate(prevProps) {
    if (this.props.params.slug !== prevProps.params.slug) {
      this.apiGetProduct(this.props.params.slug);
    }
  }

  btnAdd2CartClick(event) {
    event.preventDefault();

    const product = this.state.product;
    const quantity = parseInt(this.state.txtQuantity, 10);

    if (quantity) {
      const productWithDynamicPrice = {
        ...product,
        price: this.getFinalPrice()
      };

      const nextCart = CartUtil.addToCart(
        this.context.mycart,
        productWithDynamicPrice,
        quantity,
        this.state.selectedSize,
        this.state.cakeMessage.trim()
      );

      this.context.setMycart(nextCart);
      alert(`Đã thêm ${product.name} ${this.state.selectedSize ? `(Size ${this.state.selectedSize})` : ''} vào giỏ hàng.`);
    } else {
      alert('Vui lòng nhập số lượng');
    }
  }

  apiGetProduct(slug) {
    const slugValue = encodeURIComponent(slug || '');

    axios.get('/api/customer/products/slug/' + slugValue).then((res) => {
      if (res.data) {
        return res.data;
      }

      return axios.get('/api/customer/products/' + slug).then((fallbackRes) => fallbackRes.data);
    }).then((result) => {
      if (!result) {
        this.setState({ product: null, relatedProducts: [] });
        return;
      }

      this.setState({
        product: result,
        txtQuantity: 1,
        selectedSize: StorefrontUtil.getDefaultSize(result),
        cakeMessage: '',
        activeTab: 'description'
      });
      this.apiGetRelatedProducts(result.category._id, result._id);
    }).catch(() => {
      this.setState({ product: null, relatedProducts: [] });
    });
  }

  apiGetRelatedProducts(cid, currentProductId) {
    axios.get('/api/customer/products/category/' + cid).then((res) => {
      const result = res.data
        .filter((item) => item._id !== currentProductId)
        .slice(0, 4);
      this.setState({ relatedProducts: result });
    });
  }
}

export default withRouter(ProductDetail);
