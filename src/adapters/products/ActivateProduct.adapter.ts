import { Request } from "express";
import { ActivateProductCommand } from "../../models/request-response/products/commands";

/**
 * Simple adapter to transform PUT /products/:id/activate params to command.
 */
export const adaptActivateProduct = (req: Request): ActivateProductCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
