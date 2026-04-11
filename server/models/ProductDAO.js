require('../utils/MongooseUtil');
const Models = require('./Models');
const CategoryDAO = require('./CategoryDAO');
const mongoose = require('mongoose');

const normalizeSizes = (sizes = []) => {
  const source = Array.isArray(sizes)
    ? sizes
    : sizes
      ? [sizes]
      : [];

  const sizeOrder = ['S', 'M', 'L'];

  return [...new Set(
    source
      .filter(Boolean)
      .map((size) => size.toString().trim().toUpperCase())
      .filter((size) => sizeOrder.includes(size))
  )].sort((first, second) => sizeOrder.indexOf(first) - sizeOrder.indexOf(second));
};

const slugifyProductName = (value = '') => {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const normalizeObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
};

let ensureSizesPromise = null;

const ensureProductSizesField = async () => {
  const productsNeedingUpdate = await Models.Product.collection.find({
    $or: [
      { sizes: { $exists: false } },
      { sizes: null },
      { size: { $exists: true } }
    ]
  }).toArray();

  for (const product of productsNeedingUpdate) {
    const nextSizes = normalizeSizes(
      Array.isArray(product.sizes)
        ? product.sizes
        : Array.isArray(product.size)
          ? product.size
          : product.size
            ? [product.size]
            : []
    );

    await Models.Product.collection.updateOne(
      { _id: product._id },
      {
        $set: { sizes: nextSizes },
        $unset: { size: '' }
      }
    );
  }
};

const buildCategorySnapshot = async (category) => {
  if (!category) {
    return null;
  }

  if (category._id && category.name) {
    return { _id: normalizeObjectId(category._id), name: category.name };
  }

  const categoryId = category._id || category;
  if (!categoryId) {
    return null;
  }

  const categoryDoc = await CategoryDAO.selectByID(categoryId);
  if (categoryDoc) {
    return { _id: categoryDoc._id, name: categoryDoc.name };
  }

  return {
    _id: normalizeObjectId(categoryId),
    name: category.name || ''
  };
};

const normalizeProductRecord = async (product) => {
  if (!product) {
    return null;
  }

  const normalized = product.toObject ? product.toObject() : { ...product };
  normalized.sizes = normalizeSizes(normalized.sizes);
  normalized.category = await buildCategorySnapshot(normalized.category);
  return normalized;
};

const normalizeProductList = async (products = []) => {
  return Promise.all(products.map((product) => normalizeProductRecord(product)));
};

const normalizePagedProduct = (product = {}) => {
  return {
    ...product,
    sizes: normalizeSizes(product.sizes),
    category: product?.category && typeof product.category === 'object'
      ? product.category
      : {
          _id: product?.category || '',
          name: ''
        }
  };
};

const ProductDAO = {
  async ensureSizeFieldExists() {
    if (!ensureSizesPromise) {
      ensureSizesPromise = ensureProductSizesField().catch((error) => {
        ensureSizesPromise = null;
        throw error;
      });
    }

    await ensureSizesPromise;
  },
  async selectAll() {
    await this.ensureSizeFieldExists();
    const query = {};
    const products = await Models.Product.find(query).lean().exec();
    return normalizeProductList(products);
  },
  async selectPage(page = 1, pageSize = 4) {
    await this.ensureSizeFieldExists();

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safePageSize = Math.max(1, parseInt(pageSize, 10) || 4);
    const totalProducts = await Models.Product.countDocuments({});
    const noPages = Math.ceil(totalProducts / safePageSize);
    const curPage = noPages > 0 ? Math.min(safePage, noPages) : 1;
    const skip = noPages > 0 ? (curPage - 1) * safePageSize : 0;
    const products = await Models.Product.find({})
      .sort({ cdate: -1 })
      .skip(skip)
      .limit(safePageSize)
      .lean()
      .exec();

    return {
      products: products.map((product) => normalizePagedProduct(product)),
      noPages,
      curPage,
      totalProducts
    };
  },
  async insert(product) {
    await this.ensureSizeFieldExists();
    const payload = {
      _id: new mongoose.Types.ObjectId(),
      name: (product.name || '').toString().trim(),
      price: Number(product.price) || 0,
      image: product.image || '',
      cdate: Number(product.cdate) || new Date().getTime(),
      category: await buildCategorySnapshot(product.category),
      sizes: normalizeSizes(product.sizes)
    };

    await Models.Product.create(payload);
    return ProductDAO.selectByID(payload._id);
  },
  async selectByID(_id) {
    await this.ensureSizeFieldExists();
    const product = await Models.Product.findById(_id).lean().exec();
    return normalizeProductRecord(product);
  },
  async selectBySlug(slug) {
    await this.ensureSizeFieldExists();
    const normalizedSlug = (slug || '').toString().trim().toLowerCase();

    if (mongoose.Types.ObjectId.isValid(normalizedSlug)) {
      const productById = await Models.Product.findById(normalizedSlug).lean().exec();
      if (productById) {
        return normalizeProductRecord(productById);
      }
    }

    const products = await Models.Product.find({}).lean().exec();
    const matchedProduct = products.find((product) => {
      return slugifyProductName(product.name || '') === normalizedSlug;
    });

    return normalizeProductRecord(matchedProduct);
  },
  async update(product) {
    await this.ensureSizeFieldExists();
    const existingProduct = await Models.Product.findById(product._id).lean().exec();
    if (!existingProduct) {
      return null;
    }
    const newvalues = {
      name: (product.name || existingProduct.name || '').toString().trim(),
      price: Number(product.price) || 0,
      cdate: Number(product.cdate) || existingProduct.cdate || new Date().getTime(),
      category: await buildCategorySnapshot(product.category || existingProduct.category),
      sizes: product.sizes // <--- ĐÃ SỬA THÀNH SIZES (CÓ CHỮ S)
    };

    newvalues.sizes = normalizeSizes(newvalues.sizes);

    newvalues.image = product.image || existingProduct.image || '';

    await Models.Product.collection.updateOne(
      { _id: normalizeObjectId(product._id) },
      { $set: newvalues }
    );

    return ProductDAO.selectByID(product._id);
  },
  async delete(_id) {
    const result = await Models.Product.findByIdAndDelete(_id);
    return result;
  },
  async selectTopNew(top) {
    await this.ensureSizeFieldExists();
    const query = {};
    const mysort = { cdate: -1 }; 

    const products = await Models.Product
      .find(query)
      .sort(mysort)
      .limit(top)
      .lean()
      .exec();

    return normalizeProductList(products);
  },
  async selectTopHot(top) {
    await this.ensureSizeFieldExists();
    const items = await Models.Order.aggregate([
      { $match: { status: 'APPROVED' } }, 
      { $unwind: '$items' }, 
      {
        $group: {
          _id: '$items.product._id',
          sum: { $sum: '$items.quantity' }
        }
      },
      { $sort: { sum: -1 } }, 
      { $limit: top }
    ]).exec();

    let products = [];

    for (const item of items) {
      const product = await ProductDAO.selectByID(item._id);
      if (product) {
        products.push(product);
      }
    }

    return products;
  },
  async selectByCatID(_cid) {
    await this.ensureSizeFieldExists();
    const categoryId = normalizeObjectId(_cid);
    const query = {
      $or: [
        { 'category._id': categoryId },
        { category: categoryId },
        { 'category._id': _cid },
        { category: _cid }
      ]
    };

    const products = await Models.Product
      .find(query)
      .lean()
      .exec();

    return normalizeProductList(products);
  },
  async selectByKeyword(keyword) {
    await this.ensureSizeFieldExists();
    const query = {
      name: { $regex: new RegExp(keyword, 'i') }
    };
    const products = await Models.Product.find(query).lean().exec();
    return normalizeProductList(products);
  }
};

module.exports = ProductDAO;
