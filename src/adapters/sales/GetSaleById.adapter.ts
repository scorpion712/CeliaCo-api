import { Request } from "express";
import { GetSaleByIdCommand } from "../../models/request-response/sales/commands";

/**
 * Simple adapter to transform GET /sales/:id params to command.
 */
export const adaptGetSaleById = (req: Request): GetSaleByIdCommand => ({
  id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
