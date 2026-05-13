import { Request } from "express";

// Adapters
import { adaptPrintTicket } from "../adapters/printer/PrintTicket.adapter";

// Handlers (business logic)
import { printTicketHandler } from "../handlers/printer/printTicket/printTicket.handler";

export const PrinterController = {
  /**
   * POST /printer/:id - Print a ticket for a sale
   */
  printTicket: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptPrintTicket(req);
      await printTicketHandler(command);
      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },
};
