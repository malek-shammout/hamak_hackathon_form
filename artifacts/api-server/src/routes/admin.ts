import { Router, type IRouter } from "express";
import { AdminLoginBody, GetRegistrationParams, DeleteRegistrationParams, ListRegistrationsResponse, GetRegistrationResponse, ExportRegistrationsParams } from "@workspace/api-zod";
import { csrfToken, requireCsrf, requireAdmin, safeEqual, loginLimiter, sessionMiddleware } from "../middlewares/security";
import { readRegistrations, removeRegistration, summarize } from "../services/registrations";
import { csvExport, excelExport } from "../services/exports";

const router: IRouter = Router();
router.use("/admin", (_req, res, next) => {
  res.set({ "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" });
  next();
}, sessionMiddleware);
router.get("/admin/session", (req, res) => {
  res.json({ authenticated: !!req.session.authenticated, csrfToken: csrfToken(req) });
});
router.post("/admin/login", loginLimiter, requireCsrf, async (req, res): Promise<void> => {
  const input = AdminLoginBody.safeParse(req.body);
  if (!input.success || input.data.password.length > 1024) {
    res.status(400).json({ error: "يرجى إدخال كلمة المرور" }); return;
  }
  if (!process.env.ADMIN_PASSWORD) { res.status(503).json({ error: "دخول المنظّمين غير مهيأ" }); return; }
  if (!safeEqual(input.data.password, process.env.ADMIN_PASSWORD)) {
    res.status(401).json({ error: "كلمة المرور غير صحيحة" }); return;
  }
  await new Promise<void>((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
  req.session.authenticated = true;
  const token = csrfToken(req);
  await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
  res.json({ authenticated: true, csrfToken: token });
});
router.use("/admin", requireAdmin);
router.post("/admin/logout", requireCsrf, async (req, res): Promise<void> => {
  await new Promise<void>((resolve, reject) => req.session.destroy(err => err ? reject(err) : resolve()));
  res.clearCookie("hmk.sid", { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ success: true });
});
router.get("/admin/summary", async (_req, res): Promise<void> => {
  res.json(summarize(await readRegistrations()));
});
router.get("/admin/registrations", async (_req, res): Promise<void> => {
  res.json(ListRegistrationsResponse.parse(await readRegistrations()));
});
router.get("/admin/registrations/:id", async (req, res): Promise<void> => {
  const params = GetRegistrationParams.safeParse(req.params);
  if (!params.success || params.data.id < 1 || !Number.isInteger(params.data.id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }
  const row = (await readRegistrations()).find(r => r.id === params.data.id);
  if (!row) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json(GetRegistrationResponse.parse(row));
});
router.delete("/admin/registrations/:id", requireCsrf, async (req, res): Promise<void> => {
  const params = DeleteRegistrationParams.safeParse(req.params);
  if (!params.success || params.data.id < 1 || !Number.isInteger(params.data.id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }
  if (!await removeRegistration(params.data.id)) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.sendStatus(204);
});
router.get("/admin/export/:format", async (req, res): Promise<void> => {
  const input = ExportRegistrationsParams.safeParse(req.params);
  if (!input.success) { res.status(400).json({ error: "صيغة غير صالحة" }); return; }
  const rows = await readRegistrations();
  if (input.data.format === "csv") {
    res.attachment("hmk-registrations.csv").type("text/csv; charset=utf-8").send(csvExport(rows));
  } else {
    res.attachment("hmk-registrations.xlsx").type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").send(Buffer.from(await excelExport(rows)));
  }
});
export default router;
