import { Router } from "express";
import { CashBoxController } from "../../controllers/CashBoxController";
import { CashBoxService } from "../../services/cashbox/CashBox.service";
import { CashBoxRepository } from "../../repositories/cashbox/ICashBoxRepository";

const cashBoxRepository = new CashBoxRepository();
const cashBoxService = new CashBoxService(cashBoxRepository);
const cashBoxController = new CashBoxController(cashBoxService);

const router = Router();

// GET /caja/hoy - Get or create today's cash box
router.get("/hoy", (req, res) => cashBoxController.getTodayBox(req, res));

// POST /caja/:id/cierre - Close a cash box
router.post("/:id/cierre", (req, res) => cashBoxController.closeBox(req, res));

export default router;