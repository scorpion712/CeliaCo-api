import { Request } from "express";
import { DeleteProductCommand } from "../../models/request-response/products/commands";

/**
 * Simple adapter to transform DELETE /products/:id params to command.
 */
export const adaptDeleteProduct = (req: Request): DeleteProductCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
