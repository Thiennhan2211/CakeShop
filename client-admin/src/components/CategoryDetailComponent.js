import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class CategoryDetail extends Component {
  static contextType = MyContext; // dùng this.context để truy cập global state

  constructor(props) {
    super(props);
    this.state = {
      txtID: '',
      txtName: ''
    };
  }

  render() {
    return (
      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-page__eyebrow">Detail</span>
            <h3>Chi tiết danh mục</h3>
          </div>
        </div>

        <form className="admin-form-stack">
          <label>
            <span>ID</span>
            <input
              type="text"
              value={this.state.txtID}
              onChange={(e) =>
                this.setState({ txtID: e.target.value })
              }
              readOnly={true}
            />
          </label>

          <label>
            <span>Name</span>
            <input
              type="text"
              value={this.state.txtName}
              onChange={(e) =>
                this.setState({ txtName: e.target.value })
              }
            />
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-button" onClick={(e) => this.btnAddClick(e)}>
              Tạo mới
            </button>
            <button type="submit" className="admin-secondary-button" onClick={(e) => this.btnUpdateClick(e)}>
              Sửa
            </button>
            <button type="submit" className="admin-danger-button" onClick={(e) => this.btnDeleteClick(e)}>
              Xoá
            </button>
          </div>
        </form>
      </section>
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item && this.props.item) {
      this.setState({
        txtID: this.props.item._id,
        txtName: this.props.item.name
      });
    }
  }
  btnAddClick(e) {
    e.preventDefault();

    const name = this.state.txtName;
    if (name) {
      const cate = { name: name };
      this.apiPostCategory(cate);
    } else {
      alert('Please input name');
    }
  }
  btnUpdateClick(e) {
    e.preventDefault();
    const id = this.state.txtID;
    const name = this.state.txtName;

    if (id && name) {
      const cate = { name: name };
      this.apiPutCategory(id, cate);
    } else {
      alert('Please input id and name');
    }
  }
  btnDeleteClick(e) {
    e.preventDefault();
    if (window.confirm('ARE YOU SURE ?')) {
      const id = this.state.txtID;
      if (id) {
        this.apiDeleteCategory(id);
      } else {
        alert('Please input id');
      }
    }
  }
  // apis
  apiPostCategory(cate) {
    const config = {
      headers: {
        'x-access-token': this.context.token
      }
    };

    axios.post('/api/admin/categories', cate, config).then((res) => {
      const result = res.data;
      if (result) {
        alert('OK BABY!');
        this.apiGetCategories();
      } else {
        alert('SORRY BABY!');
      }
    });
  }
  apiGetCategories() {
    const config = {
      headers: {
        'x-access-token': this.context.token
      }
    };

    axios.get('/api/admin/categories', config).then((res) => {
      const result = res.data;
      this.props.updateCategories(result);
    });
  }
  apiPutCategory(id, cate) {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios
      .put('/api/admin/categories/' + id, cate, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          alert('OK BABY!');
          this.apiGetCategories();
        } else {
          alert('SORRY BABY!');
        }
      });
  }
  apiDeleteCategory(id) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios
      .delete('/api/admin/categories/' + id, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          alert('OK BABY !');
          this.apiGetCategories();
        } else {
          alert('SORRY BABY !');
        }
      });
  }
}

export default CategoryDetail;
