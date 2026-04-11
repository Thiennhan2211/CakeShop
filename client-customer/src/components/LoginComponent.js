import axios from 'axios';
import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import withRouter from '../utils/withRouter';
import StorefrontUtil from '../utils/StorefrontUtil';
import brandLogo from '../assets/cake-house-logo.jpg';

class Login extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      txtUsername: '',
      txtPassword: ''
    };
  }

  render() {
    if (this.context.token !== '') {
      return <Navigate replace to="/myprofile" />;
    }

    return (
      <div className="auth-layout auth-layout--single">
        <section className="form-card auth-card auth-card--narrow">
          <div className="auth-brand">
            <img src={brandLogo} alt={StorefrontUtil.brandName} />
          </div>
          <span className="section-heading__eyebrow">Đăng nhập</span>
          <h2>Chào mừng quay lại {StorefrontUtil.brandName}</h2>
          <form className="form-stack">
            <label>
              <span>Tên đăng nhập</span>
              <input
                type="text"
                value={this.state.txtUsername}
                onChange={(e) => { this.setState({ txtUsername: e.target.value }); }}
              />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input
                type="password"
                value={this.state.txtPassword}
                onChange={(e) => { this.setState({ txtPassword: e.target.value }); }}
              />
            </label>
            <button
              type="submit"
              className="primary-button"
              onClick={(e) => this.btnLoginClick(e)}
            >
              Đăng nhập
            </button>
          </form>

          <div className="auth-inline-links">
            <span>Bạn chưa có tài khoản?</span>
            <Link to="/signup" className="auth-link--accent">Hãy đăng ký</Link>
          </div>

          <Link to="/active" className="auth-link--subtle">Đã có mã kích hoạt?</Link>
        </section>
      </div>
    );
  }

  btnLoginClick(e) {
    e.preventDefault();
    const username = this.state.txtUsername;
    const password = this.state.txtPassword;
    if (username && password) {
      const account = { username: username, password: password };
      this.apiLogin(account);
    } else {
      alert('Vui lòng nhập tên đăng nhập và mật khẩu');
    }
  }

  apiLogin(account) {
    axios.post('/api/customer/login', account).then((res) => {
      const result = res.data;
      if (result.success === true) {
        this.context.setToken(result.token);
        this.context.setCustomer(result.customer);
        this.props.navigate('/home');
      } else {
        alert(result.message);
      }
    });
  }
}

export default withRouter(Login);
