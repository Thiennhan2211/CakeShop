import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import MyContext from '../contexts/MyContext';
import CartUtil from '../utils/CartUtil';
import StorefrontHelper from '../utils/StorefrontHelper';
import PageIntro from './PageIntroComponent';
import ProductCollection from './StoreProductCollectionComponent';
import withRouter from '../utils/withRouter';

function StoreProductDetail({ params }) {
  const context = useContext(MyContext);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [cakeMessage, setCakeMessage] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      const slug = (params.slug || '').toString().trim();
      setIsLoading(true);

      try {
        let nextProduct = null;

        const slugRes = await axios.get(`/api/customer/products/slug/${encodeURIComponent(slug)}`);
        nextProduct = slugRes.data;

        if (!nextProduct && /^[a-fA-F0-9]{24}$/.test(slug)) {
          const idRes = await axios.get(`/api/customer/products/${slug}`);
          nextProduct = idRes.data;
        }

        if (!nextProduct && slug) {
          const keyword = slug.replace(/-/g, ' ');
          const searchRes = await axios.get(`/api/customer/products/search/${encodeURIComponent(keyword)}`);
          nextProduct = (searchRes.data || []).find((item) => {
            return StorefrontHelper.buildProductSlug(item) === slug;
          }) || null;
        }

        setProduct(nextProduct);
        setQuantity(1);
        setSelectedSize(StorefrontHelper.getDefaultSize(nextProduct));
        setCakeMessage('');
        setActiveTab('description');

        if (nextProduct?.category?._id) {
          const relatedRes = await axios.get(`/api/customer/products/category/${nextProduct.category._id}`);
          const nextRelated = (relatedRes.data || [])
            .filter((item) => item._id !== nextProduct._id)
            .slice(0, 4);
          setRelatedProducts(nextRelated);
        } else {
          setRelatedProducts([]);
        }
      } catch (error) {
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [params.slug]);

  useEffect(() => {
    StorefrontHelper.setDocumentTitle(product?.name || 'Sản phẩm');
  }, [product]);

  const sizeOptions = useMemo(() => {
    return StorefrontHelper.normalizeSizes(product?.sizes);
  }, [product]);

  const productStory = useMemo(() => {
    return StorefrontHelper.buildProductStory(product);
  }, [product]);

  const productHighlights = useMemo(() => {
    return StorefrontHelper.buildProductHighlights(product);
  }, [product]);

  const finalPrice = useMemo(() => {
    return StorefrontHelper.getPriceBySize(product, selectedSize);
  }, [product, selectedSize]);

  const showCakeMessageInput = StorefrontHelper.shouldShowCakeMessageInput(product);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    const productWithDynamicPrice = {
      ...product,
      price: finalPrice
    };

    const nextCart = CartUtil.addToCart(
      context.mycart,
      productWithDynamicPrice,
      quantity,
      selectedSize,
      cakeMessage.trim()
    );

    context.setMycart(nextCart);
    window.alert(`Đã thêm ${product.name}${selectedSize ? ` - size ${selectedSize}` : ''} vào giỏ hàng.`);
  };

  if (isLoading) {
    return <div className="empty-state-card">Cake House đang chuẩn bị thông tin sản phẩm...</div>;
  }

  if (!product) {
    return (
      <div className="content-page">
        <PageIntro
          title="Không tìm thấy sản phẩm"
          eyebrow="Cake House"
          breadcrumbs={[
            { label: 'Trang chủ', to: '/home' },
            { label: 'Sản phẩm' }
          ]}
        />
        <div className="empty-state-card">
          Sản phẩm này hiện chưa hiển thị. Bạn thử quay lại danh mục hoặc trang chủ để xem thêm mẫu bánh khác.
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Trang chủ', to: '/home' },
    product.category?._id
      ? { label: product.category.name, to: `/product/category/${product.category._id}` }
      : null,
    { label: product.name }
  ];

  return (
    <div className="content-page">
      <PageIntro
        title={product.name}
        eyebrow={product.category?.name || 'Sản phẩm'}
        breadcrumbs={breadcrumbs}
      />

      <section className="product-detail-shell">
        <div className="product-detail-shell__media">
          <div className="product-detail-card">
            <img src={`data:image/jpg;base64,${product.image}`} alt={product.name} />
          </div>
        </div>

        <div className="product-detail-shell__content">
          <span className="section-heading__eyebrow">{product.category?.name || 'Cake House'}</span>
          <h1>{product.name}</h1>
          <strong className="product-detail__price">{StorefrontHelper.formatCurrency(finalPrice)}</strong>
          <div className="product-detail__lead">{productStory[0]}</div>

          <div className="detail-highlight-list">
            {productHighlights.map((item) => (
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
                    className={`size-pill ${selectedSize === size ? 'is-active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    Size {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="product-warning-note">{StorefrontHelper.getPreparationNotice()}</div>

          {showCakeMessageInput ? (
            <div className="detail-choice-group">
              <label>Lời nhắn gửi bánh</label>
              <textarea
                className="cake-message-input"
                rows="3"
                value={cakeMessage}
                placeholder={StorefrontHelper.getCakeMessagePlaceholder()}
                onChange={(event) => setCakeMessage(event.target.value)}
              />
            </div>
          ) : null}

          <div className="detail-choice-group">
            <label>Số lượng</label>
            <div className="product-modal__quantity">
              <button type="button" onClick={() => setQuantity((prevState) => Math.max(1, prevState - 1))}>
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1))}
              />
              <button type="button" onClick={() => setQuantity((prevState) => prevState + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="hero-banner__actions">
            <button type="button" className="primary-button" onClick={handleAddToCart}>
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </section>

      <section className="detail-tab-card">
        <div className="detail-tab-card__tabs">
          <button
            type="button"
            className={activeTab === 'description' ? 'is-active' : ''}
            onClick={() => setActiveTab('description')}
          >
            Mô tả
          </button>
          <button
            type="button"
            className={activeTab === 'info' ? 'is-active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Thông tin bổ sung
          </button>
        </div>

        {activeTab === 'description' ? (
          <div className="detail-tab-card__content detail-tab-card__content--list">
            {productStory.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        ) : (
          <div className="detail-tab-card__content detail-tab-card__content--list">
            <span>Danh mục: {product.category?.name || 'Cake House'}</span>
            <span>Khoảng giá hiện tại: {StorefrontHelper.formatCurrency(finalPrice)}</span>
            <span>{sizeOptions.length > 0 ? `Size bán ra: ${sizeOptions.join(' / ')}` : 'Sản phẩm đang bán theo phiên bản mặc định'}</span>
          </div>
        )}
      </section>

      <ProductCollection
        title="Sản phẩm tương tự"
        subtitle="Gợi ý cùng danh mục"
        products={relatedProducts}
        emptyMessage="Chưa có sản phẩm tương tự."
      />
    </div>
  );
}

export default withRouter(StoreProductDetail);
