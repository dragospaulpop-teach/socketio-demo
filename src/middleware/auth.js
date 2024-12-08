const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  try {
    const bearerToken = req.headers.authorization;
    const token = bearerToken.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.sendStatus(401);
    }

    // Add user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { authenticateToken };
