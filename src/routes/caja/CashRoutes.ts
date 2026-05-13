import { Router } from "express";
import { CashController } from "../../controllers/CashController";

const router = Router();

// GET /cash - Get today's cash summary and last 10 sales
router.get("/", CashController.getCashInfo);

export default router;