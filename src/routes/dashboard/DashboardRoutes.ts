import { Router } from "express";
import { DashboardController } from "../../controllers/DashboardController";

const router = Router();

router.get("/info", DashboardController.getInfo);

export default router;
