import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Inform extends Component {
  static contextType = MyContext; // using this.context to access global state

  render() {
    return (
      <div className="utility-bar">
        <div className="body-customer utility-bar__inner">
          <div className="utility-bar__message">
            <span className="utility-pill">Pastel Pink UI</span>
          </div>

          <div className="utility-bar__actions">
            {this.context.token === '' ? (
              <div className="utility-links">
                <Link to="/login">Đăng nhập</Link>
                <Link to="/signup">Đăng ký</Link>
                <Link to="/active">Kích hoạt</Link>
              </div>
            ) : (
              <div className="utility-links">
                <span>Xin chào <b>{this.context.customer.name}</b></span>
                <Link to="/myprofile">Tài khoản</Link>
                <Link to="/myorders">Đơn hàng</Link>
                <Link to="/home" onClick={() => this.lnkLogoutClick()}>
                  Đăng xuất
                </Link>
              </div>
            )}

            <Link to="/mycart" className="cart-pill">
              Giỏ hàng
              <b>{this.context.mycart.length}</b>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // event-handlers
  lnkLogoutClick() {
    this.context.setToken('');
    this.context.setCustomer(null);
    this.context.setMycart([]);
  }
}

export default Inform;
