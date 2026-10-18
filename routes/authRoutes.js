const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Property = require('../models/Property');
const ManagerInvite = require('../models/ManagerInvite');
const asyncHandler = require('../middleware/asyncHandler');
const { createToken } = require('../middleware/auth');

function publicUser(user) {
	return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
}

router.post('/register', asyncHandler(async (req, res) => {
	const { fullName, email, password, role } = req.body || {};
	if (role && role !== 'owner') {
		return res.status(400).json({ error: 'Manager accounts must accept a property owner invitation' });
	}
	if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' ||
			!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
		return res.status(400).json({ error: 'Full name, email, and a password of at least 8 characters are required' });
	}

	const normalizedEmail = email.trim().toLowerCase();
	const existingUser = await User.findOne({ email: normalizedEmail });
	if (existingUser) {
		return res.status(409).json({ error: 'An account with this email already exists' });
	}

	const user = await User.create({
		fullName,
		email: normalizedEmail,
		passwordHash: await bcrypt.hash(password, 12),
		role
	});
	return res.status(201).json({ token: createToken(user), user: publicUser(user) });
}));

router.post('/accept-manager-invite', asyncHandler(async (req, res) => {
	const { fullName, email, password, inviteToken } = req.body || {};
	if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' ||
			!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8 ||
			typeof inviteToken !== 'string' || inviteToken.length < 32) {
		return res.status(400).json({ error: 'Full name, valid email, password of at least 8 characters, and invite token are required' });
	}

	const normalizedEmail = email.trim().toLowerCase();
	if (await User.findOne({ email: normalizedEmail })) {
		return res.status(409).json({ error: 'An account with this email already exists' });
	}

	const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
	const now = new Date();
	const invite = await ManagerInvite.findOneAndUpdate(
		{ tokenHash, email: normalizedEmail, acceptedAt: null, expiresAt: { $gt: now } },
		{ acceptedAt: now },
		{ new: true }
	);
	if (!invite) return res.status(400).json({ error: 'Manager invitation is invalid or expired' });

	const user = await User.create({
		fullName: fullName.trim(),
		email: normalizedEmail,
		passwordHash: await bcrypt.hash(password, 12),
		role: 'manager'
	});
	await Property.updateOne(
		{ _id: invite.property, owner: invite.invitedBy },
		{ $addToSet: { managers: user._id } }
	);
	return res.status(201).json({ token: createToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
	const { email, password } = req.body || {};
	if (typeof email !== 'string' || typeof password !== 'string') {
		return res.status(400).json({ error: 'Email and password are required' });
	}

	const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
	if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
		return res.status(401).json({ error: 'Email or password is incorrect' });
	}
	return res.json({ token: createToken(user), user: publicUser(user) });
}));

module.exports = router;