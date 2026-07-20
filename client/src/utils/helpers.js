const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

// ── asyncHandler ──────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── JWT helpers ───────────────────────────────────────────────────────────────
const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

const generateTokenPair = (user) => {
  const payload = { id: user._id, role: user.role };
  return {
    accessToken:  generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// ── Order number ──────────────────────────────────────────────────────────────
const generateOrderNumber = () => {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `KAL-${ts}-${rand}`;
};

// ── Crypto reset token ────────────────────────────────────────────────────────
const generateResetToken = () => {
  const raw   = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ── Cookie options ────────────────────────────────────────────────────────────
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7d
  path:     '/api/v1/auth',
};

module.exports = {
  asyncHandler,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateOrderNumber,
  generateResetToken,
  hashToken,
  refreshTokenCookieOptions,
};
