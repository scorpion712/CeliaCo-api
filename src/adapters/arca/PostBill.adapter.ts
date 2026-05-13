import { Request } from "express";
import { PostBillCommand } from "../../models/request-response/arca/commands";

/**
 * Simple adapter to transform POST /arca body to command.
 */
export const adaptPostBill = (req: Request): PostBillCommand => ({
    cartItems: req.body.cartItems,
    customer: req.body.customer,
    voucher: req.body.voucher,
});
