const jwt = require('jsonwebtoken');
const MyConstants = require('./MyConstants');

const JwtUtil = {
  genToken(username, password) {
    return jwt.sign(
      { username, password },
      MyConstants.JWT_SECRET,
      { expiresIn: MyConstants.JWT_EXPIRES }
    );
  },

  checkToken(req, res, next) {
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    if (!token) {
      return res.json({ success: false, message: 'Auth token not supplied' });
    }
    jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.json({ success: false, message: 'Token invalid' });
      }
      req.decoded = decoded;
      next();
    });
  }
};

module.exports = JwtUtil;
