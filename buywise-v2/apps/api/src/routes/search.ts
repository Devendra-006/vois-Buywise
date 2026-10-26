import { Router, Request, Response } from "express";
import { SearchRequestSchema } from "@buywise/shared";
import { runShoppingPipeline } from "../pipeline/index.js";
import { searchRateLimiter } from "../lib/rateLimit.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const searchRouter = Router();

function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, env.JWT_SECRET);
      return decoded?.id || null;
    } catch {
      return null;
    }
  }
  return null;
}

// POST /v1/search (Standard JSON response)
searchRouter.post("/", searchRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = SearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Validation error",
        details: parseResult.error.format()
      });
      return;
    }

    const { query, weights, pincode, targetLang, forceRefresh } = parseResult.data;
    const userId = getUserIdFromRequest(req);

    const result = await runShoppingPipeline({
      query,
      weights,
      pincode,
      targetLang,
      forceRefresh,
      userId
    });

    res.json(result);
  } catch (err: any) {
    console.error("❌ Search endpoint error:", err.message);
    res.status(500).json({ error: err.message || "Failed to process search query" });
  }
});

// GET /v1/search/stream (Server-Sent Events streaming endpoint)
searchRouter.get("/stream", searchRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string;
  const targetLang = (req.query.lang as string) || "en";
  const forceRefresh = req.query.force === "true";

  if (!query || query.trim().length < 2) {
    res.status(400).json({ error: "Query parameter 'q' must be at least 2 characters" });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const userId = getUserIdFromRequest(req);

    const result = await runShoppingPipeline({
      query,
      targetLang,
      forceRefresh,
      userId,
      onProgress: (stage, message, payload) => {
        sendEvent("progress", { stage, message, payload });
      }
    });

    sendEvent("complete", result);
    res.end();
  } catch (err: any) {
    console.error("❌ SSE Search stream error:", err.message);
    sendEvent("error", { message: err.message || "Pipeline execution failed" });
    res.end();
  }
});
