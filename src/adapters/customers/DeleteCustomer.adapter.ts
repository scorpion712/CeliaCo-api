import { Request } from "express";
import { DeleteCustomerCommand } from "../../models/request-response/customers/commands";

/**
 * Simple adapter to transform DELETE /customers/:id params to command.
 */
export const adaptDeleteCustomer = (req: Request): DeleteCustomerCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
