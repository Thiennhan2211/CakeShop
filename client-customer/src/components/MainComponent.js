import { Routes, Route, Navigate } from 'react-router-dom';
import React, { Component } from 'react';
import Menu from './StoreMenuComponent';
import Home from './StoreHomeComponent';
import Product from './StoreProductListingComponent';
import ProductDetail from './StoreProductDetailComponent';
import Signup from './SignupComponent';
import Active from './ActiveComponent';
import Login from './LoginComponent';
import Myprofile from './StoreProfileHubV2Component';
import Mycart from './CartPageComponent';
import Footer from './FooterComponent';
import Contact from './ContactComponent';
import News from './NewsComponent';
import Checkout from './StoreCheckoutV2Component';
import CheckoutSuccess from './StoreCheckoutSuccessComponent';

class Main extends Component {
  render() {
    return (
      <div className="storefront-shell">
        <Menu />
        <main className="storefront-main">
          <div className="body-customer">
            <Routes>
              <Route path="/" element={<Navigate replace to="/home" />} />
              <Route path="/home" element={<Home />} />
              <Route path="/product/category/:cid" element={<Product />} />
              <Route path="/product/search/:keyword" element={<Product />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/active" element={<Active />} />
              <Route path="/login" element={<Login />} />
              <Route path="/myprofile" element={<Myprofile />} />
              <Route path="/myprofile/:section" element={<Myprofile />} />
              <Route path="/mycart" element={<Mycart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/myorders" element={<Navigate replace to="/myprofile/orders" />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/news" element={<News />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
}

export default Main;
