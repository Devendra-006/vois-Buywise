import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRegisterSchema, UserLoginSchema } from "@buywise/shared";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const authRouter = Router();

// Demo in-memory fallback user store when local dev without DB
const memoryUsers = new Map<string, any>();

// POST /v1/auth/register
authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = UserRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }

    const { email, password, name, preferredLang } = parse.data;
    const passwordHash = await bcrypt.hash(password, 10);

    if (db) {
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "User with this email already exists" });
        return;
      }

      const [created] = await db.insert(users).values({
        email,
        passwordHash,
        name,
        preferredLang
      }).returning();

      const token = jwt.sign({ id: created.id, email: created.email, name: created.name }, env.JWT_SECRET, {
        expiresIn: "7d"
      });

      res.status(201).json({
        user: { id: created.id, email: created.email, name: created.name, preferredLang: created.preferredLang },
        token
      });
      return;
    }

    // In-memory fallback
    if (memoryUsers.has(email)) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    const id = `user_${Date.now()}`;
    const userObj = { id, email, passwordHash, name, preferredLang };
    memoryUsers.set(email, userObj);

    const token = jwt.sign({ id, email, name }, env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user: { id, email, name, preferredLang }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// POST /v1/auth/login
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = UserLoginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }

    const { email, password } = parse.data;

    let userRecord: any = null;
    if (db) {
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (rows.length > 0) userRecord = rows[0];
    } else {
      userRecord = memoryUsers.get(email);
    }

    if (!userRecord) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, userRecord.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, name: userRecord.name },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        preferredLang: userRecord.preferredLang
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// GET /v1/auth/me
authRouter.get("/me", async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid token" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});
