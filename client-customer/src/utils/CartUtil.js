const CartUtil = {
  getSubtotal(mycart = []) {
    return mycart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  },

  getTotal(mycart = [], voucher = null, shippingFee = 0) {
    const subtotal = this.getSubtotal(mycart);
    const effectiveShippingFee = voucher?.type === 'freeship' ? 0 : shippingFee;
    const discountAmount = voucher?.type === 'discount' ? Math.min(subtotal, Number(voucher.discount) || 0) : 0;
    return subtotal + effectiveShippingFee - discountAmount;
  },

  getSummary(mycart = [], voucher = null, shippingFee = 0) {
    const subtotal = this.getSubtotal(mycart);
    const effectiveShippingFee = voucher?.type === 'freeship' ? 0 : shippingFee;
    const discountAmount = voucher?.type === 'discount' ? Math.min(subtotal, Number(voucher.discount) || 0) : 0;
    return {
      subtotal,
      shippingFee: effectiveShippingFee,
      discountAmount,
      total: subtotal + effectiveShippingFee - discountAmount
    };
  },

  addToCart(mycart = [], product, quantity = 1, size = '', note = '') {
    const nextCart = [...mycart];
    const index = nextCart.findIndex((item) => {
      return item.product._id === product._id && (item.size || '') === size && (item.note || '') === note;
    });

    if (index === -1) {
      nextCart.push({ product, quantity, size, note });
    } else {
      nextCart[index] = {
        ...nextCart[index],
        quantity: nextCart[index].quantity + quantity
      };
    }

    return nextCart;
  },

  updateQuantity(mycart = [], productId, quantity = 1, size = '', note = '') {
    return mycart.map((item) => {
      if (item.product._id === productId && (item.size || '') === size && (item.note || '') === note) {
        return {
          ...item,
          quantity: Math.max(1, quantity)
        };
      }

      return item;
    });
  },

  removeItem(mycart = [], productId, size = '', note = '') {
    return mycart.filter((item) => {
      return !(item.product._id === productId && (item.size || '') === size && (item.note || '') === note);
    });
  }
};

export default CartUtil;
