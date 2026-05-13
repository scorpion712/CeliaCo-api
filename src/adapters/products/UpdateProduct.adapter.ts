import { Request } from "express";
import { UpdateProductCommand } from "../../models/request-response/products/commands";

/**
 * Simple adapter to transform PUT /products/:id body and params to command.
 */
export const adaptUpdateProduct = (req: Request): UpdateProductCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    code: req.body.code,
    name: req.body.name,
    description: req.body.description,
    stock: req.body.stock,
    isEnabled: req.body.isEnabled,
    allowSaleWithoutStock: req.body.allowSaleWithoutStock,
    stockMandatory: req.body.stockMandatory,
});
