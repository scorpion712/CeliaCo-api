import { Request } from "express";
import { CreateProductCommand } from "../../models/request-response/products/commands";

/**
 * Simple adapter to transform POST /products body to command.
 */
export const adaptCreateProduct = (req: Request): CreateProductCommand => ({
    code: req.body.code,
    name: req.body.name,
    description: req.body.description,
    costPrice: req.body.costPrice,
    salePrice: req.body.salePrice,
    stock: req.body.stock,
    category: req.body.category,
    isEnabled: req.body.isEnabled,
    allowSaleWithoutStock: req.body.allowSaleWithoutStock,
    stockMandatory: req.body.stockMandatory,
});
