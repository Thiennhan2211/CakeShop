import React, { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import Menu from './MenuComponent';
import Home from './HomeComponent';
import Product from './ProductComponent';
import Category from './CategoryComponent';
import Order from './OrderComponent';
import Customer from './CustomerComponent';
import Voucher from './VoucherComponent';

class Main extends Component {
  static contextType = MyContext;

  render() {
    if (this.context.token !== '') {
      return (
        <div className="admin-shell">
          <Menu />
          <main className="admin-main">
            <Routes>
              <Route path="/admin" element={<Navigate replace to="/admin/home" />} />
              <Route path="/admin/home" element={<Home />} />
              <Route path='/admin/product' element={<Product />} />
              <Route path="/admin/category" element={<Category />} />
              <Route path='/admin/order' element={<Order />} />
              <Route path="/admin/customer" element={<Customer />} />
              <Route path="/admin/voucher" element={<Voucher />} />
            </Routes>
          </main>
        </div>
      );
    }

    return <div />;
  }
}

export default Main;
