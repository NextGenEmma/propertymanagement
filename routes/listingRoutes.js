const router = require('express').Router();
const Property = require('../models/Property');
const ListingInquiry = require('../models/ListingInquiry');
const asyncHandler = require('../middleware/asyncHandler');
const isObjectId = require('../utils/isObjectId');

const publicFields = 'name propertyType address.city address.state address.country listingPurpose askingPrice monthlyRent currency bedrooms bathrooms areaSqFt listingDescription imageUrls amenities isFeatured createdAt';
const propertyTypes = ['apartment', 'house', 'commercial', 'land', 'other'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publicListing(listing) {
  const { address = {}, ...details } = listing;
  return {
    ...details,
    address: { city: address.city, state: address.state, country: address.country }
  };
}

router.get('/facets', asyncHandler(async (req, res) => {
  const [cities, types, total] = await Promise.all([
    Property.distinct('address.city', { isPublished: true }),
    Property.distinct('propertyType', { isPublished: true }),
    Property.countDocuments({ isPublished: true })
  ]);
  return res.json({ cities: cities.filter(Boolean).sort(), types: types.filter(Boolean).sort(), total });
}));

router.get('/', asyncHandler(async (req, res) => {
  const conditions = [{ isPublished: true }];
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  const queryText = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const purpose = ['rent', 'sale'].includes(req.query.purpose) ? req.query.purpose : '';
  const propertyType = propertyTypes.includes(req.query.type) ? req.query.type : '';
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  const bedrooms = Number(req.query.bedrooms);

  if (city) conditions.push({ 'address.city': { $regex: escapeRegex(city), $options: 'i' } });
  if (purpose) conditions.push({ listingPurpose: purpose });
  if (propertyType) conditions.push({ propertyType });
  if (queryText) {
    const expression = { $regex: escapeRegex(queryText), $options: 'i' };
    conditions.push({ $or: [{ name: expression }, { listingDescription: expression }, { 'address.city': expression }, { 'address.state': expression }] });
  }
  if (Number.isFinite(bedrooms) && bedrooms > 0) conditions.push({ bedrooms: { $gte: bedrooms } });
  if ((Number.isFinite(minPrice) && minPrice > 0) || (Number.isFinite(maxPrice) && maxPrice > 0)) {
    const bounds = {};
    if (Number.isFinite(minPrice) && minPrice > 0) bounds.$gte = minPrice;
    if (Number.isFinite(maxPrice) && maxPrice > 0) bounds.$lte = maxPrice;
    if (purpose === 'sale') conditions.push({ askingPrice: bounds });
    else if (purpose === 'rent') conditions.push({ monthlyRent: bounds });
    else conditions.push({ $or: [{ listingPurpose: 'sale', askingPrice: bounds }, { listingPurpose: 'rent', monthlyRent: bounds }] });
  }

  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const limit = Math.min(24, Math.max(1, Math.floor(Number(req.query.limit) || 12)));
  const sortBy = req.query.sort === 'price-low' ? (purpose === 'sale' ? { askingPrice: 1 } : purpose === 'rent' ? { monthlyRent: 1 } : { listingPurpose: 1, askingPrice: 1, monthlyRent: 1 })
    : req.query.sort === 'price-high' ? (purpose === 'sale' ? { askingPrice: -1 } : purpose === 'rent' ? { monthlyRent: -1 } : { listingPurpose: -1, askingPrice: -1, monthlyRent: -1 })
      : { isFeatured: -1, createdAt: -1 };
  const filter = { $and: conditions };
  const [items, total] = await Promise.all([
    Property.find(filter).select(publicFields).sort(sortBy).skip((page - 1) * limit).limit(limit).lean(),
    Property.countDocuments(filter)
  ]);
  return res.json({ items: items.map(publicListing), total, page, pages: Math.ceil(total / limit) });
}));

router.get('/:listingId', asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.listingId)) return res.status(400).json({ error: 'Invalid listing id' });
  const listing = await Property.findOne({ _id: req.params.listingId, isPublished: true }).select(publicFields).lean();
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  return res.json(publicListing(listing));
}));

router.post('/:listingId/inquiries', asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.listingId)) return res.status(400).json({ error: 'Invalid listing id' });
  const { fullName, email, phone = '', message } = req.body || {};
  if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Name, valid email, and message are required' });
  }
  const listing = await Property.findOne({ _id: req.params.listingId, isPublished: true }).select('_id owner');
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  const inquiry = await ListingInquiry.create({
    property: listing._id,
    owner: listing.owner,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: typeof phone === 'string' ? phone.trim() : '',
    message: message.trim()
  });
  return res.status(201).json({ id: inquiry.id, message: 'Your inquiry has been sent to the property owner.' });
}));

module.exports = router;