import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import StorefrontUtil from '../utils/StorefrontUtil';
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

function Menu() {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    axios.get('/api/customer/categories').then((res) => {
      setCategories(res.data || []);
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

  const handleProfileClick = () => {
    navigate(context.token ? '/myprofile' : '/login');
  };

  const handleLogoutClick = () => {
    context.setToken('');
    context.setCustomer(null);
    context.setMycart([]);
    context.setAppliedVoucher(null);
    navigate('/home');
  };

  return (
    <header className="site-header">
      <div className="body-customer site-header__main">
        <Link to="/home" className="brand-mark">
          <span className="brand-mark__logo">
            <img src={brandLogo} alt={StorefrontUtil.brandName} />
          </span>
          <span className="brand-mark__copy">
            <strong>{StorefrontUtil.brandName}</strong>
            <span>{StorefrontUtil.brandTagline}</span>
          </span>
        </Link>

        <nav className="site-nav">
          <NavLink
            to="/home"
            className={({ isActive }) => isActive ? 'site-nav__link is-active' : 'site-nav__link'}
          >
            Trang chủ
          </NavLink>

          <div className="site-nav__dropdown">
            <span className="site-nav__link">Danh mục sản phẩm</span>
            <div className="site-nav__dropdown-menu">
              {categories.map((item) => (
                <NavLink
                  key={item._id}
                  to={`/product/category/${item._id}`}
                  className="site-nav__dropdown-item"
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          <NavLink
            to="/contact"
            className={({ isActive }) => isActive ? 'site-nav__link is-active' : 'site-nav__link'}
          >
            Liên hệ
          </NavLink>

          <NavLink
            to="/news"
            className={({ isActive }) => isActive ? 'site-nav__link is-active' : 'site-nav__link'}
          >
            Tin tức
          </NavLink>
        </nav>

        <div className="site-header__tools">
          <form className="site-search" onSubmit={handleSearchSubmit}>
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

          <div className="site-header__actions">
            {context.customer ? (
              <span className="site-header__welcome">{context.customer.name}</span>
            ) : null}

            <button
              type="button"
              className="header-icon-button"
              aria-label={context.token ? 'Tài khoản của tôi' : 'Đăng nhập'}
              onClick={handleProfileClick}
            >
              <ProfileIcon />
            </button>

            <Link to="/mycart" className="cart-button" aria-label="Giỏ hàng">
              <CartIcon />
              <span>{context.mycart.length}</span>
            </Link>

            {context.token ? (
              <button type="button" className="site-header__logout" onClick={handleLogoutClick}>
                Đăng xuất
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Menu;
