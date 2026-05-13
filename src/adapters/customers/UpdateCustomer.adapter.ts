import { Request } from "express";
import { UpdateCustomerCommand } from "../../models/request-response/customers/commands";

/**
 * Simple adapter to transform PUT /customers/:id body and params to command.
 */
export const adaptUpdateCustomer = (req: Request): UpdateCustomerCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    name: req.body.name,
    phone: req.body.phone,
    fiscalId: req.body.fiscalId,
    idNumber: req.body.idNumber,
    ivaCategory: req.body.ivaCategory,
});
