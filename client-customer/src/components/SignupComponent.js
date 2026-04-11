import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';
import StorefrontUtil from '../utils/StorefrontUtil';
import brandLogo from '../assets/cake-house-logo.jpg';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      txtUsername: '',
      txtPassword: '',
      txtName: '',
      txtPhone: '',
      txtEmail: ''
    };
  }

  render() {
    return (
      <div className="auth-layout auth-layout--single">
        <section className="form-card auth-card auth-card--narrow">
          <div className="auth-brand">
            <img src={brandLogo} alt={StorefrontUtil.brandName} />
          </div>
          <span className="section-heading__eyebrow">Đăng ký</span>
          <h2>Tạo tài khoản mới tại {StorefrontUtil.brandName}</h2>
          <form className="form-stack form-grid">
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

            <label>
              <span>Họ tên</span>
              <input
                type="text"
                value={this.state.txtName}
                onChange={(e) => { this.setState({ txtName: e.target.value }); }}
              />
            </label>

            <label>
              <span>Số điện thoại</span>
              <input
                type="tel"
                value={this.state.txtPhone}
                onChange={(e) => { this.setState({ txtPhone: e.target.value }); }}
              />
            </label>

            <label className="form-grid__full">
              <span>Email</span>
              <input
                type="email"
                value={this.state.txtEmail}
                onChange={(e) => { this.setState({ txtEmail: e.target.value }); }}
              />
            </label>

            <button
              type="submit"
              className="primary-button form-grid__full"
              onClick={(e) => this.btnSignupClick(e)}
            >
              Đăng ký
            </button>
          </form>

          <div className="auth-inline-links">
            <span>Đã có tài khoản?</span>
            <Link to="/login" className="auth-link--subtle auth-link--inline">Đăng nhập ngay</Link>
          </div>
        </section>
      </div>
    );
  }

  btnSignupClick(e) {
    e.preventDefault();

    const username = this.state.txtUsername;
    const password = this.state.txtPassword;
    const name = this.state.txtName;
    const phone = this.state.txtPhone;
    const email = this.state.txtEmail;

    if (username && password && name && phone && email) {
      const account = {
        username: username,
        password: password,
        name: name,
        phone: phone,
        email: email
      };

      this.apiSignup(account);
    } else {
      alert('Vui lòng nhập đầy đủ thông tin đăng ký');
    }
  }

  apiSignup(account) {
    axios.post('/api/customer/signup', account).then((res) => {
      const result = res.data;
      if (result.success) {
        alert('Đăng ký thành công. Hãy kiểm tra email để kích hoạt tài khoản.');
        this.props.navigate('/active', {
          state: {
            signupEmail: account.email,
            justSignedUp: true
          }
        });
      } else {
        alert(result.message);
      }
    });
  }
}

export default withRouter(Signup);
