import { Request } from "express";
import { PrintTicketCommand } from "../../models/request-response/printer/commands";

/**
 * Simple adapter to transform POST /printer/:id params to command.
 */
export const adaptPrintTicket = (req: Request): PrintTicketCommand => ({
    saleId: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
