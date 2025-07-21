const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET || "your-secret-key";

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      auth0Id: user.auth0Id,
    },
    secretKey,
    { expiresIn: "24h" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, secretKey);
}

module.exports = {
  generateToken,
  verifyToken,
};
