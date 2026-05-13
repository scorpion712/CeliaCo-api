import { Request } from "express";
import { UpdateSaleCommand } from "../../models/request-response/sales/commands";

/**
 * Simple adapter to transform PUT /sales/:id body and params to command.
 */
export const adaptUpdateSale = (req: Request): UpdateSaleCommand => ({
  id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
  arcaData: req.body.arcaData,
});
