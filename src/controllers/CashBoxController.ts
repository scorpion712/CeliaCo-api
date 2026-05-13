import { Request, Response } from "express";
import { CashBoxService } from "../services/cashbox/CashBox.service";

export class CashBoxController {
  constructor(private cashBoxService: CashBoxService) {}

  async getTodayBox(req: Request, res: Response) {
    try {
      const box = await this.cashBoxService.getTodayBox();
      res.json(box);
    } catch (error) {
      console.error("Error getting today's box:", error);
      res.status(500).json({ error: "Error al obtener caja del día" });
    }
  }

  async closeBox(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { cierre } = req.body;
      
      if (cierre === undefined) {
        res.status(400).json({ error: "Monto de cierre requerido" });
        return;
      }

      await this.cashBoxService.closeBox(id, cierre);
      res.json({ success: true });
    } catch (error) {
      console.error("Error closing box:", error);
      res.status(500).json({ error: "Error al cerrar caja" });
    }
  }
}