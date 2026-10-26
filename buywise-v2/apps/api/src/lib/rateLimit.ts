import rateLimit from "express-rate-limit";

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 searches per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many search requests. Please slow down to preserve quota.",
    retryAfterSeconds: 60
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 API requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});
