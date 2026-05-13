import { Request } from "express";

// Adapters
import { adaptPostBill } from "../adapters/arca/PostBill.adapter";
import { adaptSendBill } from "../adapters/arca/SendBill.adapter";

// Handlers (business logic)
import { postBillHandler } from "../handlers/arca/postBill/postBill.handler";
import { sendBillHandler } from "../handlers/arca/sendBill/sendBill.handler";

export const ArcaController = {
  /**
   * POST /arca - Create and post a bill to ARCA
   */
  postBill: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptPostBill(req);
      const result = await postBillHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /arca/:id - Send an existing sale bill to ARCA
   */
  sendBill: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptSendBill(req);
      const result = await sendBillHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
