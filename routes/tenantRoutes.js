const router = require('express').Router();
const Tenant = require('../models/Tenant');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const loadProperty = require('../middleware/propertyAccess');
const isObjectId = require('../utils/isObjectId');

router.get('/:propertyId/tenants', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const tenants = await Tenant.find({ property: req.property.id }).sort({ createdAt: -1 });
  return res.json(tenants);
}));

router.post('/:propertyId/tenants', authenticate, loadProperty, asyncHandler(async (req, res) => {
  const { fullName, email, phone, leaseStart, leaseEnd, monthlyRent, securityDeposit, currency } = req.body || {};
  const tenant = await Tenant.create({
    property: req.property.id,
    fullName,
    email,
    phone,
    leaseStart,
    leaseEnd,
    monthlyRent,
    securityDeposit,
    currency
  });
  req.property.status = 'occupied';
  await req.property.save();
  return res.status(201).json(tenant);
}));

router.patch('/:propertyId/tenants/:tenantId', authenticate, loadProperty, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.tenantId)) return res.status(400).json({ error: 'Invalid tenant id' });
  const allowedFields = ['fullName', 'email', 'phone', 'leaseStart', 'leaseEnd', 'monthlyRent', 'securityDeposit', 'currency', 'status'];
  const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key)));
  const tenant = await Tenant.findOneAndUpdate(
    { _id: req.params.tenantId, property: req.property.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  if (tenant.status === 'inactive') {
    const activeTenant = await Tenant.exists({ property: req.property.id, status: 'active' });
    if (!activeTenant) {
      req.property.status = 'vacant';
      await req.property.save();
    }
  }
  return res.json(tenant);
}));

module.exports = router;