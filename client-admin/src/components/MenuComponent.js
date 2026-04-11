import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import myLogo from './logo.jpg';

class Menu extends Component {
  static contextType = MyContext;

  render() {
    return (
      <aside className="admin-sidebar shadow">
        <div className="admin-sidebar__brand">
          <div style={{display: 'flex', alignItems: 'center'}}>
            <img 
              src={myLogo} alt="Cake Shop Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <span className="brand-text" style={{fontWeight: '800', color: 'var(--admin-pink-500)', fontSize: '20px'}}>Cake House</span>
          </div>
        </div>
        
        <nav className="admin-nav">
          <NavLink to='/admin/home' className="admin-nav__link">
            <i className="bi bi-house-door"></i> <span className="nav-text">Trang chủ</span>
          </NavLink>
          <NavLink to='/admin/category' className="admin-nav__link">
            <i className="bi bi-grid"></i> <span className="nav-text">Danh mục</span>
          </NavLink>
          <NavLink to='/admin/product' className="admin-nav__link">
            <i className="bi bi-box-seam"></i> <span className="nav-text">Sản phẩm</span>
          </NavLink>
          <NavLink to='/admin/order' className="admin-nav__link">
            <i className="bi bi-receipt"></i> <span className="nav-text">Đơn hàng</span>
          </NavLink>
          <NavLink to='/admin/customer' className="admin-nav__link">
            <i className="bi bi-people"></i> <span className="nav-text">Khách hàng</span>
          </NavLink>
          <NavLink to='/admin/voucher' className="admin-nav__link">
            <i className="bi bi-ticket-perforated"></i> <span className="nav-text">Voucher</span>
          </NavLink>
        </nav>

        {/* Nút đăng xuất được design lại để thu gọn được */}
        <div className="admin-sidebar__footer">
          <button 
            type="button" 
            className="admin-nav__link" 
            style={{border: 'none', width: '100%', background: 'transparent', cursor: 'pointer', textAlign: 'left'}} 
            onClick={() => this.lnkLogoutClick()}
          >
            <i className="bi bi-box-arrow-right" style={{color: '#d9534f'}}></i> 
            <span className="nav-text" style={{color: '#d9534f', fontWeight: 'bold'}}>Đăng xuất</span>
          </button>
        </div>
      </aside>
    );
  }

  lnkLogoutClick() {
    this.context.setToken('');
    this.context.setUsername('');
  }
}

export default Menu;
