import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import CartUtil from '../utils/CartUtil';
import StorefrontHelper from '../utils/StorefrontHelper';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5C6.5 5 2.1 8.5 1 12c1.1 3.5 5.5 7 11 7s9.9-3.5 11-7c-1.1-3.5-5.5-7-11-7Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Zm0-1.8a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 8V7a5 5 0 0 1 10 0v1h2.4l-1.1 11.5A2.5 2.5 0 0 1 15.8 22H8.2a2.5 2.5 0 0 1-2.5-2.5L4.6 8H7Zm2 0h6V7a3 3 0 0 0-6 0v1Zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function QuantityInput({ value, onChange }) {
  return (
    <div className="product-modal__quantity">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}>
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1))}
      />
      <button type="button" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

function StoreProductCollection({
  title,
  subtitle,
  products = [],
  emptyMessage = 'Chưa có sản phẩm phù hợp.',
  sectionClassName = '',
  showHeading = true
}) {
  const navigate = useNavigate();
  const context = useContext(MyContext);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [sizePickerProduct, setSizePickerProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cakeMessage, setCakeMessage] = useState('');

  const activeProduct = sizePickerProduct || quickViewProduct;
  const sizeOptions = StorefrontHelper.normalizeSizes(activeProduct?.sizes);
  const showCakeMessageInput = StorefrontHelper.shouldShowCakeMessageInput(activeProduct);

  const openQuickView = (product) => {
    setSizePickerProduct(null);
    setQuickViewProduct(product);
    setQuantity(1);
    setSelectedSize(StorefrontHelper.getDefaultSize(product));
    setCakeMessage('');
  };

  const openSizePicker = (product) => {
    setQuickViewProduct(null);
    setSizePickerProduct(product);
    setQuantity(1);
    setSelectedSize(StorefrontHelper.getDefaultSize(product));
    setCakeMessage('');
  };

  const closeModals = () => {
    setQuickViewProduct(null);
    setSizePickerProduct(null);
    setSelectedSize('');
    setQuantity(1);
    setCakeMessage('');
  };

  const handleAddToCart = (product, size, nextQuantity) => {
    const finalSize = size || StorefrontHelper.getDefaultSize(product);
    const productWithDynamicPrice = {
      ...product,
      price: StorefrontHelper.getPriceBySize(product, finalSize)
    };

    const nextCart = CartUtil.addToCart(
      context.mycart,
      productWithDynamicPrice,
      nextQuantity,
      finalSize,
      cakeMessage.trim()
    );

    context.setMycart(nextCart);
    window.alert(`Đã thêm ${product.name}${finalSize ? ` - size ${finalSize}` : ''} vào giỏ hàng.`);
    closeModals();
  };

  return (
    <section className={`showcase-section ${sectionClassName}`.trim()}>
      {showHeading ? (
        <div className="section-heading">
          <div>
            {subtitle ? <span className="section-heading__eyebrow">{subtitle}</span> : null}
            <h2>{title}</h2>
          </div>
          <span className="section-heading__line" />
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="product-showcase-grid">
          {products.map((product) => (
            <article key={product._id} className="store-product-card">
              <div className="store-product-card__media">
                <Link to={StorefrontHelper.buildProductPath(product)} className="store-product-card__image-link">
                  <img src={`data:image/jpg;base64,${product.image}`} alt={product.name} />
                </Link>

                <div className="store-product-card__actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Xem nhanh"
                    onClick={() => openQuickView(product)}
                  >
                    <EyeIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Chọn size"
                    onClick={() => openSizePicker(product)}
                  >
                    <BagIcon />
                  </button>
                </div>
              </div>

              <div className="store-product-card__content">
                <span className="store-product-card__category">{product.category?.name || 'Signature'}</span>
                <h3>
                  <Link to={StorefrontHelper.buildProductPath(product)}>{product.name}</Link>
                </h3>
                <strong className="store-product-card__price">
                  {StorefrontHelper.formatCurrency(product.price)}
                </strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state-card">{emptyMessage}</div>
      )}

      {quickViewProduct ? (
        <div className="product-modal-backdrop" onClick={closeModals}>
          <div className="product-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="product-modal__close" onClick={closeModals}>
              ×
            </button>

            <div className="product-modal__grid">
              <div className="product-modal__image">
                <img src={`data:image/jpg;base64,${quickViewProduct.image}`} alt={quickViewProduct.name} />
              </div>

              <div className="product-modal__info">
                <span className="section-heading__eyebrow">Xem nhanh</span>
                <h3>{quickViewProduct.name}</h3>
                <strong className="product-modal__price">
                  {StorefrontHelper.formatCurrency(StorefrontHelper.getPriceBySize(quickViewProduct, selectedSize))}
                </strong>
                <span className="product-modal__category">{quickViewProduct.category?.name || 'Bộ sưu tập đặc biệt'}</span>

                <div className="product-modal__story">
                  {StorefrontHelper.buildProductStory(quickViewProduct).map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>

                {sizeOptions.length > 0 ? (
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
                ) : null}

                <div className="product-warning-note">{StorefrontHelper.getPreparationNotice()}</div>

                {showCakeMessageInput ? (
                  <textarea
                    className="cake-message-input"
                    rows="3"
                    value={cakeMessage}
                    placeholder={StorefrontHelper.getCakeMessagePlaceholder()}
                    onChange={(event) => setCakeMessage(event.target.value)}
                  />
                ) : null}

                <div className="product-modal__actions">
                  <button type="button" className="soft-button" onClick={() => openSizePicker(quickViewProduct)}>
                    Chọn size
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigate(StorefrontHelper.buildProductPath(quickViewProduct))}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {sizePickerProduct ? (
        <div className="product-modal-backdrop" onClick={closeModals}>
          <div className="product-modal product-modal--compact" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="product-modal__close" onClick={closeModals}>
              ×
            </button>
            <span className="section-heading__eyebrow">Chọn phiên bản</span>
            <h3>{sizePickerProduct.name}</h3>
            <strong className="product-modal__price">
              {StorefrontHelper.formatCurrency(StorefrontHelper.getPriceBySize(sizePickerProduct, selectedSize))}
            </strong>

            {sizeOptions.length > 0 ? (
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
            ) : null}

            <div className="product-warning-note">{StorefrontHelper.getPreparationNotice()}</div>

            {showCakeMessageInput ? (
              <textarea
                className="cake-message-input"
                rows="3"
                value={cakeMessage}
                placeholder={StorefrontHelper.getCakeMessagePlaceholder()}
                onChange={(event) => setCakeMessage(event.target.value)}
              />
            ) : null}

            <QuantityInput value={quantity} onChange={setQuantity} />

            <div className="product-modal__actions">
              <button type="button" className="soft-button" onClick={closeModals}>
                Để sau
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleAddToCart(sizePickerProduct, selectedSize, quantity)}
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default StoreProductCollection;
