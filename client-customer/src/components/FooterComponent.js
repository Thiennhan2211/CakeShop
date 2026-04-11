import React from 'react';
import { Link } from 'react-router-dom';
import StorefrontUtil from '../utils/StorefrontUtil';
import brandLogo from '../assets/cake-house-logo.jpg';

const footerLinks = [
  { label: 'Chính sách giao hàng', to: '/contact' },
  { label: 'Chính sách trả hàng - hoàn tiền', to: '/contact' },
  { label: 'Phương thức thanh toán', to: '/contact' },
  { label: 'Điều khoản & điều kiện thanh toán', to: '/contact' },
  { label: 'Bảo vệ thông tin cá nhân', to: '/contact' },
  { label: 'Thông tin liên hệ', to: '/contact' },
  { label: 'Cửa hàng', to: '/contact' }
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <span className="footer-logo">
            <img src={brandLogo} alt={StorefrontUtil.brandName} />
          </span>
          <div>
            <h3>{StorefrontUtil.brandName}</h3>
            <span>{StorefrontUtil.brandTagline}</span>
          </div>
        </div>

        <div className="site-footer__contact">
          <span>Công ty TNHH {StorefrontUtil.brandName}</span>
          <span>Đặng Thuỳ Trâm, Phường 13, quận Bình Hạnh, Thành phố Hồ Chí Minh</span>
          <span>Hotline: 19009090</span>
          <span>Email: thiennhan105295@gmail.com</span>
          <span>Giờ mở cửa: 08:00 - 21:30 mỗi ngày</span>
        </div>

        <div className="site-footer__feature">
          <span className="site-footer__feature-label">Cake House</span>
          <strong>Tinh tế trong từng lớp bánh, trọn vẹn trong từng yêu thương.</strong>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© 2026 {StorefrontUtil.brandName}.</span>
        <nav className="site-footer__links">
          {footerLinks.map((item) => (
            <Link key={item.label} to={item.to}>{item.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
