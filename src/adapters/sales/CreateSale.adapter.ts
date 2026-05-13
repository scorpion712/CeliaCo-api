import { Request } from "express";
import { SaleType } from "../../models";
import { CreateSaleCommand } from "../../models/request-response/sales/commands";

/**
 * Simple adapter to transform POST /sales body to command. 
 */
export const adaptCreateSale = (req: Request): CreateSaleCommand => ({
  total: req.body.total,
  type: req.body.type as SaleType,
  cartItems: req.body.cartItems,
  // Extract customerId from customer object if sent, otherwise use customerId field directly
  customerId: req.body.customer?.id ?? req.body.customerId ?? null,
  arcaData: req.body.arcaData,
  iva: req.body.iva,
});
