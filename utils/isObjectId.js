const mongoose = require('mongoose');

module.exports = (value) => mongoose.isValidObjectId(value);