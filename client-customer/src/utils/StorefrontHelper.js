const StorefrontHelper = {
  brandName: 'Cake House',
  brandTagline: 'Bake & Cake',
  defaultShippingFee: 30000,

  formatCurrency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} đ`;
  },

  formatDate(value) {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleDateString('vi-VN');
  },

  setDocumentTitle(title) {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = title ? `${title} | ${this.brandName}` : this.brandName;
  },

  stripVietnamese(value = '') {
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  },

  slugify(value = '') {
    return this.stripVietnamese(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  buildProductSlug(product = {}) {
    return this.slugify(product?.name || product || '');
  },

  buildProductPath(product = {}) {
    return `/product/${this.buildProductSlug(product)}`;
  },

  normalizeSizes(sizes = []) {
    const order = ['S', 'M', 'L'];
    const source = Array.isArray(sizes) ? sizes : sizes ? [sizes] : [];

    return [...new Set(
      source
        .filter(Boolean)
        .map((size) => size.toString().trim().toUpperCase())
        .filter((size) => order.includes(size))
    )].sort((first, second) => order.indexOf(first) - order.indexOf(second));
  },

  getDefaultSize(product) {
    return this.normalizeSizes(product?.sizes)[0] || '';
  },

  getPriceBySize(productOrPrice, size = '') {
    const basePrice = typeof productOrPrice === 'object'
      ? Number(productOrPrice?.price) || 0
      : Number(productOrPrice) || 0;
    const normalizedSize = (size || '').toUpperCase();

    if (normalizedSize === 'M') {
      return basePrice + 30000;
    }

    if (normalizedSize === 'L') {
      return basePrice + 50000;
    }

    return basePrice;
  },

  shouldShowCakeMessageInput(product) {
    const categoryName = this.stripVietnamese(product?.category?.name || '');
    return categoryName.includes('banh cuoi') || categoryName.includes('banh sinh nhat');
  },

  getPreparationNotice() {
    return 'Bánh sẽ luôn được làm mới ngay khi có đơn. Vui lòng hãy đặt trước ít nhất 1 tiếng để chúng em chuẩn bị.';
  },

  getCakeMessagePlaceholder() {
    return 'Mỗi chiếc bánh là một câu chuyện, hãy để lại lời nhắn của bạn để câu chuyện ấy thêm ý nghĩa…';
  },

  getOrderStatusLabel(status = '') {
    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === 'PENDING') {
      return 'Chờ xác nhận';
    }

    if (normalizedStatus === 'APPROVED') {
      return 'Đã xác nhận';
    }

    if (normalizedStatus === 'SHIPPING') {
      return 'Đang giao';
    }

    if (normalizedStatus === 'DELIVERED') {
      return 'Đã giao';
    }

    if (normalizedStatus === 'CANCELED') {
      return 'Đã hủy';
    }

    return status || 'Đang xử lý';
  },

  getPaymentMethodLabel(method = '') {
    const normalizedMethod = method.toUpperCase();

    if (normalizedMethod === 'COD') {
      return 'Thanh toán khi giao hàng (COD)';
    }

    if (normalizedMethod === 'BANKING') {
      return 'Chuyển khoản ngân hàng';
    }

    if (normalizedMethod === 'MOMO') {
      return 'Ví MoMo';
    }

    if (normalizedMethod === 'ZALOPAY') {
      return 'ZaloPay';
    }

    return 'Thanh toán';
  },

  getVoucherVisual(voucher = {}) {
    const isFreeship = voucher.type === 'freeship';
    return {
      cardClassName: isFreeship ? 'voucher-card voucher-card--freeship' : 'voucher-card voucher-card--discount',
      iconLabel: isFreeship ? 'Xe giao hàng' : 'Phiếu giảm giá',
      badge: isFreeship ? 'Freeship' : 'Sale'
    };
  },

  buildBreadcrumbs(items = []) {
    return items.filter(Boolean).map((item) => {
      if (typeof item === 'string') {
        return { label: item };
      }

      return item;
    });
  },

  buildProductStory(product) {
    const name = product?.name || 'Mẫu bánh đặc biệt';
    const category = product?.category?.name || 'bộ sưu tập signature';

    return [
      `${name} được hoàn thiện theo phong cách ${category.toLowerCase()} nhẹ nhàng và chỉn chu.`,
      'Cốt bánh mềm, lớp kem vừa vị và tổng thể gọn mắt để hợp sinh nhật, kỷ niệm hay những buổi tiệc nhỏ.',
      'Từng chiếc bánh được chuẩn bị cẩn thận để lên form đẹp và giữ trải nghiệm thưởng thức trọn vẹn.'
    ];
  },

  buildProductHighlights(product) {
    const category = product?.category?.name || 'Signature';
    const sizes = this.normalizeSizes(product?.sizes);

    return [
      `Danh mục: ${category}`,
      'Trang trí thanh lịch, hợp tone ngọt nhẹ',
      'Đóng gói gọn gàng, dễ di chuyển',
      sizes.length > 0 ? `Có size: ${sizes.join(' / ')}` : 'Giá giữ nguyên cho phiên bản mặc định'
    ];
  }
};

export default StorefrontHelper;
