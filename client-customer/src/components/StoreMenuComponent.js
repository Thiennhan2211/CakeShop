import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import StorefrontHelper from '../utils/StorefrontHelper';
import brandLogo from '../assets/cake-house-logo.jpg';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 4a6.5 6.5 0 1 0 4.08 11.56l4.43 4.44 1.42-1.42-4.44-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2c-4.4 0-8 2.47-8 5.5 0 .83.67 1.5 1.5 1.5h13c.83 0 1.5-.67 1.5-1.5 0-3.03-3.6-5.5-8-5.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7V6a5 5 0 0 1 10 0v1h2.25a1 1 0 0 1 .99 1.14l-1.1 9A3 3 0 0 1 16.16 20H7.84a3 3 0 0 1-2.98-2.86l-1.1-9A1 1 0 0 1 4.75 7H7Zm2 0h6V6a3 3 0 0 0-6 0v1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StoreMenu() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    axios.get('/api/customer/categories').then((res) => {
      setCategories(res.data || []);
    }).catch(() => {
      setCategories([]);
    });
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = keyword.trim();

    if (!value) {
      navigate('/home');
      return;
    }

    navigate(`/product/search/${encodeURIComponent(value)}`);
  };

  const handleLogout = () => {
    context.setToken('');
    context.setCustomer(null);
    context.setMycart([]);
    context.setAppliedVoucher(null);
    navigate('/home');
  };

  return (
    <header className="store-header">
      <div className="body-customer store-header__inner">
        <Link to="/home" className="store-header__brand">
          <span className="store-header__brand-logo">
            <img src={brandLogo} alt={StorefrontHelper.brandName} />
          </span>
          <span className="store-header__brand-copy">
            <strong>{StorefrontHelper.brandName}</strong>
            <span>{StorefrontHelper.brandTagline}</span>
          </span>
        </Link>

        <nav className="store-header__nav">
          <NavLink
            to="/home"
            className={({ isActive }) => isActive ? 'store-header__nav-link is-active' : 'store-header__nav-link'}
          >
            Trang chủ
          </NavLink>

          <div className="store-header__nav-dropdown">
            <span className="store-header__nav-link">Danh mục sản phẩm</span>
            <div className="store-header__nav-menu">
              {categories.map((item) => (
                <NavLink
                  key={item._id}
                  to={`/product/category/${item._id}`}
                  className="store-header__nav-menu-item"
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          <NavLink
            to="/contact"
            className={({ isActive }) => isActive ? 'store-header__nav-link is-active' : 'store-header__nav-link'}
          >
            Liên hệ
          </NavLink>

          <NavLink
            to="/news"
            className={({ isActive }) => isActive ? 'store-header__nav-link is-active' : 'store-header__nav-link'}
          >
            Tin tức
          </NavLink>
        </nav>

        <div className="store-header__tools">
          <form className="store-header__search" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={keyword}
              placeholder="Tìm kiếm"
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button type="submit" aria-label="Tìm kiếm">
              <SearchIcon />
            </button>
          </form>

          {context.customer ? (
            <span className="store-header__welcome">{context.customer.name}</span>
          ) : null}

          <button
            type="button"
            className="store-header__icon"
            aria-label={context.token ? 'Tài khoản của tôi' : 'Đăng nhập'}
            onClick={() => navigate(context.token ? '/myprofile' : '/login')}
          >
            <ProfileIcon />
          </button>

          <Link to="/mycart" className="store-header__icon store-header__cart" aria-label="Giỏ hàng">
            <CartIcon />
            <span>{context.mycart.length}</span>
          </Link>

          {context.token ? (
            <button type="button" className="store-header__logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          ) : (
            <button type="button" className="store-header__logout" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default StoreMenu;
