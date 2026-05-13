import { Request } from "express";
import { CreateCustomerCommand } from "../../models/request-response/customers/commands";

/**
 * Simple adapter to transform POST /customers body to command.
 * Only name is required. Other fields are optional.
 */
export const adaptCreateCustomer = (req: Request): CreateCustomerCommand => ({
    name: req.body.name,
    phone: req.body.phone,
    fiscalId: req.body.fiscalId,
    idNumber: req.body.idNumber,
    ivaCategory: req.body.ivaCategory,
});
