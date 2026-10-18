const mongoose = require('mongoose');
const Property = require('../models/Property');
const asyncHandler = require('./asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;
  if (!mongoose.isValidObjectId(propertyId)) {
    return res.status(400).json({ error: 'Invalid property id' });
  }

  const property = await Property.findOne({
    _id: propertyId,
    $or: [{ owner: req.user.id }, { managers: req.user.id }]
  });
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  req.property = property;
  return next();
});