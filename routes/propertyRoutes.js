const router = require('express').Router();
const crypto = require('crypto');
const User = require('../models/User');
const Property = require('../models/Property');
const ManagerInvite = require('../models/ManagerInvite');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, requireOwner } = require('../middleware/auth');
const loadProperty = require('../middleware/propertyAccess');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
	const properties = await Property.find({
		$or: [{ owner: req.user.id }, { managers: req.user.id }]
	}).sort({ createdAt: -1 });
	return res.json(properties);
}));

router.post('/', requireOwner, asyncHandler(async (req, res) => {
	const property = await Property.create({ ...req.body, owner: req.user.id });
	return res.status(201).json(property);
}));

router.get('/:propertyId', loadProperty, (req, res) => res.json(req.property));

router.patch('/:propertyId', requireOwner, loadProperty, asyncHandler(async (req, res) => {
	const allowedFields = ['name', 'propertyType', 'address', 'monthlyRent', 'currency', 'timezone', 'status', 'notes', 'listingPurpose', 'askingPrice', 'bedrooms', 'bathrooms', 'areaSqFt', 'listingDescription', 'imageUrls', 'amenities', 'isPublished'];
	const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
	Object.assign(req.property, updates);
	await req.property.save();
	return res.json(req.property);
}));

router.post('/:propertyId/managers', requireOwner, loadProperty, asyncHandler(async (req, res) => {
	const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
	if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'A valid manager email is required' });

	const manager = await User.findOne({ email, role: 'manager' }).select('_id fullName email role');
	if (manager) {
		req.property.managers.addToSet(manager.id);
		await req.property.save();
		return res.json({ propertyId: req.property.id, manager });
	}

	if (await User.exists({ email })) {
		return res.status(409).json({ error: 'This email belongs to an owner account and cannot accept a manager invitation' });
	}

	const inviteToken = crypto.randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
	await ManagerInvite.deleteMany({ property: req.property.id, email, acceptedAt: null });
	await ManagerInvite.create({
		property: req.property.id,
		invitedBy: req.user.id,
		email,
		tokenHash: crypto.createHash('sha256').update(inviteToken).digest('hex'),
		expiresAt
	});
	return res.status(201).json({ email, inviteToken, expiresAt });
}));

router.delete('/:propertyId/managers/:managerId', requireOwner, loadProperty, asyncHandler(async (req, res) => {
	req.property.managers.pull(req.params.managerId);
	await req.property.save();
	return res.status(204).end();
}));

module.exports = router;