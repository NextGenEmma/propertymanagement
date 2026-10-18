const router = require('express').Router();
const Tenant = require('../models/Tenant');
const RentPayment = require('../models/RentPayment');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const loadProperty = require('../middleware/propertyAccess');
const isObjectId = require('../utils/isObjectId');

router.get('/:propertyId/rent-payments', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const filter = { property: req.property.id };
  if (req.query.period) filter.period = req.query.period;
  if (req.query.status) filter.status = req.query.status;
  const payments = await RentPayment.find(filter).populate('tenant', 'fullName email phone').sort({ period: -1 });
  return res.json(payments);
}));

router.post('/:propertyId/rent-payments', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const { tenantId, period, amount, dueDate, currency } = req.body || {};
  if (!isObjectId(tenantId)) return res.status(400).json({ error: 'A valid tenantId is required' });
  const tenant = await Tenant.findOne({ _id: tenantId, property: req.property.id, status: 'active' });
  if (!tenant) return res.status(404).json({ error: 'Active tenant not found for this property' });

  const payment = await RentPayment.create({
    property: req.property.id,
    tenant: tenant.id,
    period,
    amount,
    dueDate,
    currency: currency || tenant.currency
  });
  return res.status(201).json(payment);
}));

router.patch('/:propertyId/rent-payments/:paymentId/paid', authenticate, loadProperty, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.paymentId)) return res.status(400).json({ error: 'Invalid payment id' });
  const payment = await RentPayment.findOneAndUpdate(
    { _id: req.params.paymentId, property: req.property.id },
    { status: 'paid', paidAt: new Date(), paymentReference: req.body?.paymentReference || '' },
    { new: true, runValidators: true }
  );
  if (!payment) return res.status(404).json({ error: 'Rent payment not found' });
  return res.json(payment);
}));

module.exports = router;