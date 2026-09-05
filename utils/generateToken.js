const jwt = require('jsonwebtoken');

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'ai_student_super_secret_jwt_key_2026_secure!';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

const verifyJwt = (token) => {
  const secret = process.env.JWT_SECRET || 'ai_student_super_secret_jwt_key_2026_secure!';
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyJwt,
};
