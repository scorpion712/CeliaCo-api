import { Request } from "express";
import { validatePaginationQuery } from "../../helpers";
import { GetCustomersCommand } from "../../models/request-response/customers/commands";
import { Customer } from "../../repositories";

/**
 * Simple adapter to transform GET /customers query params to command.
 */
export const adaptGetCustomers = (req: Request): GetCustomersCommand => {
    const pagination = validatePaginationQuery({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
    });

    return {
        limit: pagination.limit,
        offset: pagination.offset,
        tab: (req.query.tab as string) ?? "actives",
        search: (req.query.search as string) ?? "",
    };
};

/**
 * Adapt database response to Customer objects.
 */
export const adaptGetCustomersResponse = (response: any) => {
    return response.map((row: any) => {
        return {
            id: row.id,
            name: row.name,
            phone: row.phone,
            fiscalId: row.fiscalId,
            idNumber: row.idNumber,
            ivaCategory: row.ivaCategory,
            disabled: row.deletedAt ? true : false,
        } as Customer;
    });
}