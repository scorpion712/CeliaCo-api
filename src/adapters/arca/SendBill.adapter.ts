import { Request } from "express";
import { SendBillCommand } from "../../models/request-response/arca/commands";

/**
 * Simple adapter to transform POST /arca/:id params to command.
 */
export const adaptSendBill = (req: Request): SendBillCommand => ({
    saleId: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
