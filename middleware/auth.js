const jwt = require('jsonwebtoken');

function createToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me') {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '12h'
  });
}

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token || !process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me') {
    return res.status(401).json({ error: 'A valid bearer token is required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireOwner(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access is required' });
  }
  return next();
}

module.exports = { authenticate, createToken, requireOwner };