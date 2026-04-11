import React from 'react';
import StorefrontUtil from '../utils/StorefrontUtil';

function Contact() {
  return (
    <div className="content-page">
      <section className="page-banner page-banner--compact">
        <span className="section-heading__eyebrow">Liên hệ</span>
        <h1>Kết nối cùng {StorefrontUtil.brandName}</h1>
      </section>

      <section className="contact-grid">
        <article className="contact-card">
          <span className="section-heading__eyebrow">Cửa hàng</span>
          <h3>Shop chính</h3>
          <span>Đặng Thuỳ Trâm, Phường 13, quận Bình Thạnh, Thành phố Hồ Chí Minh</span>
          <span>08:00 - 21:30 mỗi ngày</span>
        </article>

        <article className="contact-card">
          <span className="section-heading__eyebrow">Hỗ trợ nhanh</span>
          <h3>Hotline & online</h3>
          <span>19009090</span>
          <span>thiennhan105295@gmail.com</span>
          <span>Tư vấn đơn hàng, size và lịch giao bánh</span>
        </article>

        <article className="contact-card">
          <span className="section-heading__eyebrow">Đặt bánh riêng</span>
          <h3>Custom concept</h3>
          <span>Nhận thiết kế theo màu sắc, số tuổi, chủ đề và số lượng khách</span>
          <span>Liên hệ sớm để giữ lịch chuẩn bị bánh</span>
        </article>
      </section>
    </div>
  );
}

export default Contact;
