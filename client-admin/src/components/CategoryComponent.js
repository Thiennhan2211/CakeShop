import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import CategoryDetail from './CategoryDetailComponent';

class Category extends Component {
  static contextType = MyContext; 

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      itemSelected: null
    };
  }

  render() {
    const cates = this.state.categories.map((item) => {
      return (
        <tr
          key={item._id}
          className={this.state.itemSelected?._id === item._id ? 'admin-table__row is-active' : 'admin-table__row'}
          onClick={() => this.trItemClick(item)}
        >
          <td>{item._id}</td>
          <td>{item.name}</td>
        </tr>
      );
    });

    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <span className="admin-page__eyebrow">Category</span>
            <h2>Quản lý danh mục</h2>
          </div>
        </header>

        <div className="admin-split-layout">
          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="admin-page__eyebrow">List</span>
                <h3>Danh mục hiện có</h3>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>{cates}</tbody>
              </table>
            </div>
          </section>

          <CategoryDetail item={this.state.itemSelected} updateCategories={this.updateCategories}/>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.apiGetCategories();
  }

  // event handlers
  trItemClick(item) {
    this.setState({ itemSelected: item });
  }
  updateCategories = (categories) => {
    this.setState({ categories: categories });
  }

  // apis
  apiGetCategories() {
    const config = {
      headers: {
        'x-access-token': this.context.token
      }
    };

    axios.get('/api/admin/categories', config).then((res) => {
      const result = res.data;
      this.setState({ categories: result });
    });
  }
}

export default Category;
