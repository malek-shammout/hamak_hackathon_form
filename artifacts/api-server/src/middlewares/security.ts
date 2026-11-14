import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { pool } from "@workspace/db";
import type { RequestHandler } from "express";
import { rateLimit, type Store, type Options } from "express-rate-limit";

declare module "express-session" {
  interface SessionData { authenticated?: boolean; csrfToken?: string; }
}
const PgSession = connectPgSimple(session);
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required");
export const sessionMiddleware = session({
  name: "hmk.sid",
  secret: process.env.SESSION_SECRET,
  store: new PgSession({ pool, tableName: "hmk_sessions", createTableIfMissing: false }),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 },
});
export function csrfToken(req: Parameters<RequestHandler>[0]) {
  req.session.csrfToken ??= randomBytes(32).toString("hex");
  return req.session.csrfToken;
}
export const requireCsrf: RequestHandler = (req, res, next) => {
  const token = req.get("X-CSRF-Token");
  if (!token || !req.session.csrfToken || !safeEqual(token, req.session.csrfToken)) {
    res.status(403).json({ error: "انتهت صلاحية الجلسة، حدّث الصفحة وحاول مجدداً" }); return;
  }
  next();
};
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.authenticated) { res.status(401).json({ error: "يلزم تسجيل دخول المنظّمين" }); return; }
  next();
};
export function safeEqual(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
// Shared atomic limits across Autoscale instances. Store hashed addresses, not raw IPs.
class PgRateStore implements Store {
  windowMs = 60_000;
  constructor(public prefix: string) {}
  init(options: Options) { this.windowMs = options.windowMs; }
  private key(key: string) { return `${this.prefix}:${createHash("sha256").update(key).digest("hex")}`; }
  async increment(key: string) {
    const { rows } = await pool.query(
      `INSERT INTO hmk_rate_limits(key,hits,reset_at) VALUES($1,1,NOW()+$2::int * INTERVAL '1 millisecond')
       ON CONFLICT(key) DO UPDATE SET
       hits = CASE WHEN hmk_rate_limits.reset_at <= NOW() THEN 1 ELSE hmk_rate_limits.hits+1 END,
       reset_at = CASE WHEN hmk_rate_limits.reset_at <= NOW() THEN EXCLUDED.reset_at ELSE hmk_rate_limits.reset_at END
       RETURNING hits,reset_at`, [this.key(key), this.windowMs]);
    return { totalHits: Number(rows[0].hits), resetTime: new Date(rows[0].reset_at) };
  }
  async decrement(key: string) { await pool.query("UPDATE hmk_rate_limits SET hits=GREATEST(0,hits-1) WHERE key=$1", [this.key(key)]); }
  async resetKey(key: string) { await pool.query("DELETE FROM hmk_rate_limits WHERE key=$1", [this.key(key)]); }
}
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false,
  store: new PgRateStore("registration"), message: { error: "طلبات كثيرة، يرجى المحاولة لاحقاً" },
});
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false,
  store: new PgRateStore("login"), message: { error: "محاولات دخول كثيرة، حاول بعد 15 دقيقة" },
});
