require('../utils/MongooseUtil');
const Models = require('./Models');

const AdminDAO = {
  async selectByUsernameAndPassword(username, password) {
    return await Models.Admin.findOne({ username, password });
  }
};

module.exports = AdminDAO;
