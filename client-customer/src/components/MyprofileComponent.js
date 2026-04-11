import axios from 'axios';
import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';

class Myprofile extends Component {
  static contextType = MyContext; // using this.context to access global state

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
    if (this.context.token === '') return (<Navigate replace to="/login" />);
    return (
      <div className="content-page">
        <section className="form-card form-card--wide">
          <span className="section-heading__eyebrow">Tài khoản</span>
          <h2>Thông tin cá nhân</h2>
          <form className="form-stack form-grid">
            <label>
              <span>Tên đăng nhập</span>
              <input type="text" value={this.state.txtUsername}
                onChange={(e) => { this.setState({ txtUsername: e.target.value }) }} />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input type="password" value={this.state.txtPassword}
                onChange={(e) => { this.setState({ txtPassword: e.target.value }) }} />
            </label>
            <label>
              <span>Họ tên</span>
              <input type="text" value={this.state.txtName}
                onChange={(e) => { this.setState({ txtName: e.target.value }) }} />
            </label>
            <label>
              <span>Số điện thoại</span>
              <input type="tel" value={this.state.txtPhone}
                onChange={(e) => { this.setState({ txtPhone: e.target.value }) }} />
            </label>
            <label className="form-grid__full">
              <span>Email</span>
              <input type="email" value={this.state.txtEmail}
                onChange={(e) => { this.setState({ txtEmail: e.target.value }) }} />
            </label>
            <button type="submit" className="primary-button form-grid__full"
              onClick={(e) => this.btnUpdateClick(e)}>
              Cập nhật
            </button>
          </form>
        </section>
      </div>
    );
  }

  componentDidMount() {
    if (this.context.customer) {
      this.setState({
        txtUsername: this.context.customer.username,
        txtPassword: this.context.customer.password,
        txtName: this.context.customer.name,
        txtPhone: this.context.customer.phone,
        txtEmail: this.context.customer.email
      });
    }
  }

  // event-handlers
  btnUpdateClick(e) {
    e.preventDefault();
    const username = this.state.txtUsername;
    const password = this.state.txtPassword;
    const name = this.state.txtName;
    const phone = this.state.txtPhone;
    const email = this.state.txtEmail;

    if (username && password && name && phone && email) {
      const customer = { username: username, password: password, name: name, phone: phone, email: email };
      this.apiPutCustomer(this.context.customer._id, customer);
    } else {
      alert('Vui lòng nhập đầy đủ thông tin tài khoản');
    }
  }

  // apis
  apiPutCustomer(id, customer) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/customer/customers/' + id, customer, config).then((res) => {
      const result = res.data;
      if (result) {
        alert('Cập nhật thông tin thành công.');
        this.context.setCustomer(result);
      } else {
        alert('Không thể cập nhật thông tin.');
      }
    });
  }
}

export default Myprofile;
