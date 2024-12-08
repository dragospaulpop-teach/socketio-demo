const jwt = require("jsonwebtoken");

function authenticateSocketToken(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      return next(new Error("Invalid token"));
    }

    // Add user info to socket
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error("Invalid token"));
  }
}

module.exports = { authenticateSocketToken };
