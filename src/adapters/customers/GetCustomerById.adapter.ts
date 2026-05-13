import { Request } from "express";
import { GetCustomerByIdCommand } from "../../models/request-response/customers/commands";

/**
 * Simple adapter to transform GET /customers/:id params to command.
 */
export const adaptGetCustomerById = (req: Request): GetCustomerByIdCommand => ({
    id: Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
});
