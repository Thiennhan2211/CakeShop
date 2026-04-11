import axios from 'axios';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import MyContext from '../contexts/MyContext';

const defaultVoucher = {
  _id: '',
  code: '',
  title: '',
  discount: 0,
  minOrder: 0,
  description: '',
  type: 'discount',
  active: 1
};

function Voucher() {
  const context = useContext(MyContext);
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState(defaultVoucher);

  const config = useMemo(() => ({
    headers: { 'x-access-token': context.token }
  }), [context.token]);

  const loadVouchers = useCallback(() => {
    axios.get('/api/admin/vouchers', config).then((res) => {
      setVouchers(res.data || []);
    }).catch(() => {
      setVouchers([]);
    });
  }, [config]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleSelect = (voucher) => {
    setForm({
      _id: voucher._id,
      code: voucher.code || '',
      title: voucher.title || '',
      discount: voucher.discount || 0,
      minOrder: voucher.minOrder || 0,
      description: voucher.description || '',
      type: voucher.type || 'discount',
      active: Number(voucher.active ?? 1)
    });
  };

  const handleReset = () => {
    setForm(defaultVoucher);
  };

  const handleSubmit = () => {
    const payload = {
      code: (form.code || '').trim().toUpperCase(),
      title: (form.title || '').trim(),
      discount: Number(form.discount) || 0,
      minOrder: Number(form.minOrder) || 0,
      description: (form.description || '').trim(),
      type: form.type,
      active: Number(form.active)
    };

    if (!payload.code || !payload.title) {
      window.alert('Vui lòng nhập mã và tiêu đề voucher.');
      return;
    }

    if (form._id) {
      axios.put(`/api/admin/vouchers/${form._id}`, payload, config).then((res) => {
        if (res.data?.success) {
          loadVouchers();
          handleReset();
          window.alert('Đã cập nhật voucher.');
          return;
        }

        window.alert(res.data?.message || 'Không thể cập nhật voucher.');
      }).catch((error) => {
        window.alert(error?.response?.data?.message || 'Không thể cập nhật voucher.');
      });
      return;
    }

    axios.post('/api/admin/vouchers', payload, config).then((res) => {
      if (res.data?.success) {
        loadVouchers();
        handleReset();
        window.alert('Đã tạo voucher mới.');
        return;
      }

      window.alert(res.data?.message || 'Không thể tạo voucher.');
    }).catch((error) => {
      window.alert(error?.response?.data?.message || 'Không thể tạo voucher.');
    });
  };

  const handleDelete = () => {
    if (!form._id) {
      return;
    }

    axios.delete(`/api/admin/vouchers/${form._id}`, config).then((res) => {
      if (res.data?.success) {
        loadVouchers();
        handleReset();
        window.alert('Đã xóa voucher.');
      }
    }).catch((error) => {
      window.alert(error?.response?.data?.message || 'Không thể xóa voucher.');
    });
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <span className="admin-page__eyebrow">Voucher</span>
          <h2>Quản lý voucher</h2>
        </div>
      </header>

      <section className="admin-split-layout">
        <div className="admin-panel">
          <div className="admin-section-heading">
            <div>
              <span className="admin-page__eyebrow">Danh sách</span>
              <h3>Voucher hiện có</h3>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Tiêu đề</th>
                  <th>Loại</th>
                  <th>Giảm</th>
                  <th>Đơn tối thiểu</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr
                    key={voucher._id}
                    className={`admin-table__row ${form._id === voucher._id ? 'is-active' : ''}`}
                    onClick={() => handleSelect(voucher)}
                  >
                    <td><strong>{voucher.code}</strong></td>
                    <td>{voucher.title}</td>
                    <td>{voucher.type === 'freeship' ? 'Freeship' : 'Giảm tiền'}</td>
                    <td>{new Intl.NumberFormat('vi-VN').format(voucher.discount || 0)} đ</td>
                    <td>{new Intl.NumberFormat('vi-VN').format(voucher.minOrder || 0)} đ</td>
                    <td>{Number(voucher.active) === 0 ? 'Ẩn' : 'Hiển thị'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-section-heading">
            <div>
              <span className="admin-page__eyebrow">Chi tiết</span>
              <h3>Thiết lập voucher</h3>
            </div>
          </div>

          <form className="admin-form-stack">
            <label>
              <span>Mã voucher</span>
              <input
                type="text"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              />
            </label>
            <label>
              <span>Tiêu đề</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <label>
              <span>Loại voucher</span>
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="discount">Giảm tiền</option>
                <option value="freeship">Freeship</option>
              </select>
            </label>
            <label>
              <span>Tiền giảm</span>
              <input
                type="number"
                value={form.discount}
                onChange={(event) => setForm({ ...form, discount: event.target.value })}
              />
            </label>
            <label>
              <span>Đơn tối thiểu</span>
              <input
                type="number"
                value={form.minOrder}
                onChange={(event) => setForm({ ...form, minOrder: event.target.value })}
              />
            </label>
            <label>
              <span>Mô tả</span>
              <input
                type="text"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label>
              <span>Trạng thái</span>
              <select
                value={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.value })}
              >
                <option value={1}>Hiển thị</option>
                <option value={0}>Ẩn</option>
              </select>
            </label>

            <div className={`admin-voucher-preview ${form.type === 'freeship' ? 'is-freeship' : 'is-discount'}`}>
              <strong>{form.title || 'Voucher preview'}</strong>
              <span>{form.code || 'CAKEHOUSE'}</span>
              <small>
                {form.type === 'freeship'
                  ? `Freeship cho đơn từ ${new Intl.NumberFormat('vi-VN').format(form.minOrder || 0)} đ`
                  : `Giảm ${new Intl.NumberFormat('vi-VN').format(form.discount || 0)} đ cho đơn từ ${new Intl.NumberFormat('vi-VN').format(form.minOrder || 0)} đ`}
              </small>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="admin-primary-button" onClick={handleSubmit}>
                {form._id ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button type="button" className="admin-secondary-button" onClick={handleReset}>
                Làm mới
              </button>
              <button type="button" className="admin-danger-button" onClick={handleDelete}>
                Xóa voucher
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Voucher;
