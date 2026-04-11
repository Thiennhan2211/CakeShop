import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Login extends Component {
  static contextType = MyContext; // dùng this.context để truy cập global state

  constructor(props) {
    super(props);
    this.state = {
      txtUsername: '',
      txtPassword: ''
    };
  }

  render() {
    if (this.context.token === '') {
      return (
        <div className="admin-auth-shell">
          <section className="admin-auth-card">
            <span className="admin-sidebar__eyebrow">Đăng nhập quản trị</span>
            <h2>Admin login</h2>

            <form className="admin-form-stack">
              <label>
                <span>Username</span>
                <input
                  type="text"
                  value={this.state.txtUsername}
                  onChange={(e) =>
                    this.setState({ txtUsername: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={this.state.txtPassword}
                  onChange={(e) =>
                    this.setState({ txtPassword: e.target.value })
                  }
                />
              </label>

              <button
                type="submit"
                className="admin-primary-button"
                onClick={(e) => this.btnLoginClick(e)}
              >
                Đăng nhập
              </button>
            </form>
          </section>
        </div>
      );
    }

    return <div />;
  }

  // event handlers
  btnLoginClick(e) {
    e.preventDefault();

    const { txtUsername, txtPassword } = this.state;

    if (txtUsername && txtPassword) {
      const account = {
        username: txtUsername,
        password: txtPassword
      };
      this.apiLogin(account);
    } else {
      alert('Vui lòng nhập username và password');
    }
  }

  // apis
  apiLogin(account) {
    axios.post('/api/admin/login', account).then((res) => {
      const result = res.data;

      if (result.success === true) {
        this.context.setToken(result.token);
        this.context.setUsername(account.username);
      } else {
        alert(result.message);
      }
    });
  }
}

export default Login;
