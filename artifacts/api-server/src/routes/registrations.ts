import { Router, type IRouter } from "express";
import { registrationSchema } from "../lib/registration-validation";
import { registrationLimiter } from "../middlewares/security";
import { saveRegistration } from "../services/registrations";
import { getRegistrationState } from "../services/settings";

const router: IRouter = Router();
const CLOSED = "التسجيل مغلق حالياً";

router.get("/registration-config", async (_req, res): Promise<void> => {
  const state = await getRegistrationState();
  res.set("Cache-Control", "no-store").json({
    deadline: state.deadline, open: state.open, mode: state.mode, closedMessage: state.closedMessage,
  });
});
router.post("/registrations", registrationLimiter, async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const state = await getRegistrationState();
  if (!state.open) { res.status(410).json({ error: state.closedMessage || CLOSED }); return; }
  const result = registrationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "يرجى مراجعة بيانات التسجيل", issues: result.error.issues.map(i => ({ path: i.path, message: i.message })) });
    return;
  }
  try {
    res.status(201).json(await saveRegistration(result.data));
  } catch (error) {
    if (error instanceof Error && error.message === "REGISTRATION_CLOSED") {
      res.status(410).json({ error: state.closedMessage || CLOSED }); return;
    }
    throw error;
  }
});
export default router;
