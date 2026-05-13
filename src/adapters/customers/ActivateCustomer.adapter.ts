import { Request } from "express";
import { ActivateCustomerCommand } from "../../models/request-response/customers/commands";

/**
 * Simple adapter to transform PUT /customers/:id/activate params to command.
 */
export const adaptActivateCustomer = (req: Request): ActivateCustomerCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
