import "dotenv/config";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (e) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  message: {
    message: "Muitas tentativas de login, tente novamente mais tarde",
  },
});
