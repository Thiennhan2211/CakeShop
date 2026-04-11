import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

const normalizeSizes = (sizes = []) => {
  const sizeOrder = ['S', 'M', 'L'];
  const source = Array.isArray(sizes)
    ? sizes
    : sizes
      ? [sizes]
      : [];

  return [...new Set(
    source
      .filter(Boolean)
      .map((size) => size.toString().trim().toUpperCase())
      .filter((size) => sizeOrder.includes(size))
  )].sort((first, second) => sizeOrder.indexOf(first) - sizeOrder.indexOf(second));
};

class ProductDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      txtID: '',
      txtName: '',
      txtPrice: 0,
      cmbCategory: '',
      imgProduct: '',
      txtSize: [],
      isImageModalOpen: false
    };
  }

  componentDidMount() {
    this.apiGetCategories();
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item && this.props.item != null) {
      this.setState({
        txtID: this.props.item._id,
        txtName: this.props.item.name,
        txtPrice: this.props.item.price,
        cmbCategory: this.props.item.category?._id || this.props.item.category || '',
        txtSize: normalizeSizes(
          Array.isArray(this.props.item.sizes)
            ? this.props.item.sizes
            : this.props.item.size
        ),
        imgProduct: 'data:image/jpg;base64,' + this.props.item.image
      });
    }
  }

  handleSizeChange(e) {
    const value = e.target.value;
    if (e.target.checked) {
      this.setState({ txtSize: normalizeSizes([...this.state.txtSize, value]) });
    } else {
      this.setState({ txtSize: normalizeSizes(this.state.txtSize.filter((size) => size !== value)) });
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.setState({ imgProduct: evt.target.result, isImageModalOpen: false });
      };
      reader.readAsDataURL(file);
    }
  }

  previewImage(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.setState({ imgProduct: evt.target.result, isImageModalOpen: false });
      };
      reader.readAsDataURL(file);
    }
  }

  btnAddClick(e) {
    e.preventDefault();

    const name = this.state.txtName;
    const price = parseInt(this.state.txtPrice, 10);
    const category = this.state.cmbCategory;
    const image = this.state.imgProduct.replace(/^data:image\/[a-z]+;base64,/, '');

    if (name && price && category && image) {
      const prod = {
        name: name,
        price: price,
        category: category,
        image: image,
        sizes: normalizeSizes(this.state.txtSize)
      };
      this.apiPostProduct(prod);
    } else {
      alert('Please input name, price, category and image');
    }
  }

  btnUpdateClick(e) {
    e.preventDefault();

    const id = this.state.txtID;
    const name = this.state.txtName;
    const price = parseInt(this.state.txtPrice, 10);
    const category = this.state.cmbCategory;

    let image = null;
    if (this.state.imgProduct.startsWith('data:image')) {
      image = this.state.imgProduct.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    if (id && name && price && category) {
      const prod = { name, price, category, sizes: normalizeSizes(this.state.txtSize) };
      if (image) {
        prod.image = image;
      }

      this.apiPutProduct(id, prod);
    } else {
      alert('Please input id, name, price and category');
    }
  }

  btnDeleteClick(e) {
    e.preventDefault();

    if (window.confirm('ARE YOU SURE ?')) {
      const id = this.state.txtID;
      if (id) {
        this.apiDeleteProduct(id);
      } else {
        alert('Please input id');
      }
    }
  }

  apiGetCategories() {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios.get('/api/admin/categories', config).then((res) => {
      this.setState({ categories: res.data });
    });
  }

  apiPostProduct(prod) {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios.post('/api/admin/products', prod, config).then((res) => {
      const result = res.data;
      if (result) {
        alert('OK BABY!');
        this.apiGetProducts();
      } else {
        alert('SORRY BABY!');
      }
    });
  }

  apiGetProducts() {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios
      .get('/api/admin/products?page=' + this.props.curPage, config)
      .then((res) => {
        const result = res.data;
        this.props.updateProducts(result.products, result.noPages);
      });
  }

  apiPutProduct(id, prod) {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios
      .put('/api/admin/products/' + id, prod, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          alert('OK BABY!');
          this.apiGetProducts();
        } else {
          alert('SORRY BABY!');
        }
      });
  }

  apiDeleteProduct(id) {
    const config = {
      headers: { 'x-access-token': this.context.token }
    };

    axios
      .delete('/api/admin/products/' + id, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          alert('OK BABY!');
          this.apiGetProducts();
        } else {
          alert('SORRY BABY!');
        }
      })
      .catch((err) => {
        console.error(err);
        alert('DELETE ERROR');
      });
  }

  render() {
    const cates = this.state.categories.map((cate) => (
      <option key={cate._id} value={cate._id}>
        {cate.name}
      </option>
    ));

    return (
      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <span className="admin-page__eyebrow">Detail</span>
            <h3>Chi tiết sản phẩm</h3>
          </div>
        </div>

        <form className="admin-form-stack">
          <label>
            <span>ID</span>
            <input
              type="text"
              value={this.state.txtID}
              onChange={(e) => this.setState({ txtID: e.target.value })}
              readOnly={true}
            />
          </label>

          <label>
            <span>Name</span>
            <input
              type="text"
              value={this.state.txtName}
              onChange={(e) => this.setState({ txtName: e.target.value })}
            />
          </label>

          <label>
            <span>Price</span>
            <input
              type="text"
              value={this.state.txtPrice}
              onChange={(e) => this.setState({ txtPrice: e.target.value })}
            />
          </label>

          <label>
            <span>Category</span>
            <select
              value={this.state.cmbCategory}
              onChange={(e) => this.setState({ cmbCategory: e.target.value })}
            >
              <option value="">Select category</option>
              {cates}
            </select>
          </label>

          <label>
            <span>Kích cỡ (Size) bán ra:</span>
            <div style={{ display: 'flex', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontWeight: 'normal', color: 'var(--admin-ink)', gap: '8px' }}>
                <input type="checkbox" value="S" checked={this.state.txtSize.includes('S')} onChange={(e) => this.handleSizeChange(e)} style={{ minHeight: 'auto', padding: '0', width: 'auto' }} /> Nhỏ (S)
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontWeight: 'normal', color: 'var(--admin-ink)', gap: '8px' }}>
                <input type="checkbox" value="M" checked={this.state.txtSize.includes('M')} onChange={(e) => this.handleSizeChange(e)} style={{ minHeight: 'auto', padding: '0', width: 'auto' }} /> Vừa (M)
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontWeight: 'normal', color: 'var(--admin-ink)', gap: '8px' }}>
                <input type="checkbox" value="L" checked={this.state.txtSize.includes('L')} onChange={(e) => this.handleSizeChange(e)} style={{ minHeight: 'auto', padding: '0', width: 'auto' }} /> Lớn (L)
              </label>
            </div>
          </label>

          <label>
            <span>Image</span>
            <button type="button" className="admin-secondary-button" onClick={() => this.setState({ isImageModalOpen: true })}>
              <i className="fa fa-upload"></i> Chọn ảnh sản phẩm
            </button>
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

          <div className="admin-image-preview">
            {this.state.imgProduct ? (
              <img
                src={this.state.imgProduct}
                alt={this.state.txtName || 'Preview'}
              />
            ) : (
              <div className="admin-empty-state">Chọn ảnh để xem preview.</div>
            )}
          </div>
        </form>

        {this.state.isImageModalOpen ? (
          <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="admin-modal-content" style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '400px', textAlign: 'center' }}>
              <h3>Tải ảnh lên</h3>
              <div
                className="drag-drop-zone"
                style={{ border: '2px dashed var(--admin-pink-400)', borderRadius: '15px', padding: '40px 20px', background: 'var(--admin-pink-50)', cursor: 'pointer', position: 'relative', marginTop: '15px' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => this.handleDrop(e)}
              >
                <i className="fa fa-image" style={{ fontSize: '40px', color: 'var(--admin-pink-300)' }}></i>
                <span style={{ display: 'block', marginTop: '12px' }}>Kéo thả ảnh vào đây hoặc click để chọn</span>
                <input type="file" accept="image/jpeg, image/png, image/gif" onChange={(e) => this.previewImage(e)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              </div>
              <button type="button" className="admin-danger-button mt-3" onClick={() => this.setState({ isImageModalOpen: false })}>Đóng</button>
            </div>
          </div>
        ) : null}
      </section>
    );
  }
}

export default ProductDetail;
