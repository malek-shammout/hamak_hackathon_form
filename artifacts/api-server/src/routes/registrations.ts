import { Router, type IRouter } from "express";
import { registrationSchema, registrationOpen, DEADLINE } from "../lib/registration-validation";
import { registrationLimiter } from "../middlewares/security";
import { saveRegistration } from "../services/registrations";

const router: IRouter = Router();
router.get("/registration-config", (_req, res) => {
  res.set("Cache-Control", "no-store").json({ deadline: DEADLINE, open: registrationOpen() });
});
router.post("/registrations", registrationLimiter, async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  if (!registrationOpen()) { res.status(410).json({ error: "انتهى التسجيل" }); return; }
  const result = registrationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "يرجى مراجعة بيانات التسجيل", issues: result.error.issues.map(i => ({ path: i.path, message: i.message })) });
    return;
  }
  try {
    res.status(201).json(await saveRegistration(result.data));
  } catch (error) {
    if (error instanceof Error && error.message === "REGISTRATION_CLOSED") {
      res.status(410).json({ error: "انتهى التسجيل" }); return;
    }
    throw error;
  }
});
export default router;
