const CryptoUtil = {
  md5(input) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(input).digest('hex');
  }
};
module.exports = CryptoUtil;
