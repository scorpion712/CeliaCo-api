import { Request } from "express";
import { validatePaginationQuery, validateDatesQuery } from "../../helpers";
import { Sale } from "../../models";
import { GetSalesCommand } from "../../models/request-response/sales/commands";

/**
 * Simple adapter to transform GET /sales query params to command.
 * Uses existing helpers instead of Joi.
 */
export const adaptGetSales = (req: Request): GetSalesCommand => {
  const pagination = validatePaginationQuery({
    limit: Number(req.query.limit),
    offset: Number(req.query.offset),
  });

  const dates = validateDatesQuery({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  });

  return {
    limit: pagination.limit,
    offset: pagination.offset,
    startDate: dates.startDate,
    endDate: dates.endDate,
    type: req.query.type ? Number(req.query.type) : undefined,
    customerName: (req.query.customerName as string) || undefined,
  };
};

/**
 * Adapt database response to Sale objects.
 */
export const adaptGetSalesResponse = (response: any[]) => {
  return response.map((row: any) => {
    return {
      id: row.id,
      date: row.createdAt || row.date,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      total: row.total,
      customer: row.customer ?? "Consumidor Final",
      customerId: row.customerId,
      cae: row.cae,
      type: row.type,
      iva: row.iva,
    } as Sale;
  });
};
