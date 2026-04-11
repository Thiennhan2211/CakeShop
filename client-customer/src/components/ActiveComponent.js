import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';
import StorefrontUtil from '../utils/StorefrontUtil';
import brandLogo from '../assets/cake-house-logo.jpg';

class Active extends Component {
  constructor(props) {
    super(props);
    this.state = {
      txtID: '',
      txtToken: '',
      signupEmail: props.location?.state?.signupEmail || '',
      justSignedUp: Boolean(props.location?.state?.justSignedUp)
    };
  }

  componentDidMount() {
    const params = new URLSearchParams(this.props.location?.search || '');
    const txtID = params.get('id') || this.state.txtID;
    const txtToken = params.get('token') || this.state.txtToken;

    if (txtID || txtToken) {
      this.setState({ txtID, txtToken });
    }
  }

  render() {
    return (
      <div className="auth-layout auth-layout--single">
        <section className="form-card auth-card auth-card--narrow">
          <div className="auth-brand">
            <img src={brandLogo} alt={StorefrontUtil.brandName} />
          </div>
          <span className="section-heading__eyebrow">Kích hoạt tài khoản</span>
          <h2>Nhập mã từ email để hoàn tất đăng ký</h2>

          {this.state.justSignedUp ? (
            <div className="status-chip status-chip--soft">
              {this.state.signupEmail || 'Email đăng ký đã được ghi nhận'}
            </div>
          ) : null}

          <form className="form-stack">
            <label>
              <span>ID khách hàng</span>
              <input
                type="text"
                value={this.state.txtID}
                onChange={(e) => { this.setState({ txtID: e.target.value }); }}
              />
            </label>
            <label>
              <span>Token kích hoạt</span>
              <input
                type="text"
                value={this.state.txtToken}
                onChange={(e) => { this.setState({ txtToken: e.target.value }); }}
              />
            </label>
            <button
              type="submit"
              className="primary-button"
              onClick={(e) => this.btnActiveClick(e)}
            >
              Kích hoạt
            </button>
          </form>

          <div className="auth-inline-links">
            <span>Quay lại trang đăng nhập</span>
            <Link to="/login" className="auth-link--subtle auth-link--inline">Đăng nhập</Link>
          </div>
        </section>
      </div>
    );
  }

  btnActiveClick(e) {
    e.preventDefault();
    const id = this.state.txtID;
    const token = this.state.txtToken;

    if (id && token) {
      this.apiActive(id, token);
    } else {
      alert('Vui lòng nhập ID và token kích hoạt');
    }
  }

  apiActive(id, token) {
    const body = { id: id, token: token };
    axios.post('/api/customer/active', body).then((res) => {
      const result = res.data;
      if (result) {
        alert('Kích hoạt thành công. Bạn có thể đăng nhập ngay.');
        this.props.navigate('/login');
      } else {
        alert('ID hoặc token không hợp lệ');
      }
    });
  }
}

export default withRouter(Active);
