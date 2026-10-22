const router = require('express').Router();
const ListingInquiry = require('../models/ListingInquiry');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const loadProperty = require('../middleware/propertyAccess');
const isObjectId = require('../utils/isObjectId');

router.get('/:propertyId/inquiries', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const inquiries = await ListingInquiry.find({ property: req.property.id }).sort({ createdAt: -1 });
  return res.json(inquiries);
}));

router.patch('/:propertyId/inquiries/:inquiryId', authenticate, loadProperty, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.inquiryId)) return res.status(400).json({ error: 'Invalid inquiry id' });
  const { status } = req.body || {};
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be new, contacted, or closed' });
  }
  const inquiry = await ListingInquiry.findOneAndUpdate(
    { _id: req.params.inquiryId, property: req.property.id },
    { status },
    { new: true, runValidators: true }
  );
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
  return res.json(inquiry);
}));

module.exports = router;