const router = require('express').Router();
const MaintenanceRequest = require('../models/MaintenanceRequest');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const loadProperty = require('../middleware/propertyAccess');
const isObjectId = require('../utils/isObjectId');

router.get('/:propertyId/maintenance', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const filter = { property: req.property.id };
  if (req.query.status) filter.status = req.query.status;
  const requests = await MaintenanceRequest.find(filter).sort({ createdAt: -1 });
  return res.json(requests);
}));

router.post('/:propertyId/maintenance', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const { title, description, priority, cost, currency, vendorName } = req.body || {};
  const request = await MaintenanceRequest.create({
    property: req.property.id,
    title,
    description,
    priority,
    cost,
    currency,
    vendorName,
    requestedBy: req.user.id
  });
  return res.status(201).json(request);
}));

router.patch('/:propertyId/maintenance/:requestId', authenticate, loadProperty, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.requestId)) return res.status(400).json({ error: 'Invalid maintenance request id' });
  const allowedFields = ['title', 'description', 'priority', 'status', 'cost', 'currency', 'vendorName'];
  const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key)));
  if (updates.status === 'resolved') updates.resolvedAt = new Date();
  const request = await MaintenanceRequest.findOneAndUpdate(
    { _id: req.params.requestId, property: req.property.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!request) return res.status(404).json({ error: 'Maintenance request not found' });
  return res.json(request);
}));

module.exports = router;