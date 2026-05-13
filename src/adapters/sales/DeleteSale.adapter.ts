import { Request } from "express";
import { DeleteSaleCommand } from "../../models/request-response/sales/commands";

/**
 * Simple adapter to transform DELETE /sales/:id params to command.
 */
export const adaptDeleteSale = (req: Request): DeleteSaleCommand => ({
  id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
