import { Request } from "express";
import { validatePaginationQuery } from "../../helpers";
import { GetProductsCommand } from "../../models/request-response/products/commands";

export const adaptGetProducts = (req: Request): GetProductsCommand => {
  const pagination = validatePaginationQuery({
    limit: Number(req.query.pageSize || req.query.limit),
    offset: Number(
      (Number(req.query.page) - 1) * Number(req.query.pageSize || 10),
    ),
  });

  return {
    limit: pagination.limit,
    offset: pagination.offset,
    search: req.query.search as string | undefined,
    stock: req.query.stock as
      | "all"
      | "in_stock"
      | "low_stock"
      | "out_of_stock"
      | undefined,
    status: req.query.status as "all" | "active" | "inactive" | undefined,
    category: req.query.category as string | undefined,
  };
};

export const adaptGetProductsResponse = (response: any) => {
  return response?.map((row: any) => {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      costPrice: row.costprice || 0,
      salePrice: row.saleprice || 0,
      stock: row.stock,
      category: row.category || "",
      isEnabled: row.isenabled,
      allowSaleWithoutStock: row.allowsalewithoutstock || false,
      stockMandatory: row.stockmandatory || false,
      createdAt: row.createdat ? new Date(row.createdat) : null,
      updatedAt: row.updatedat ? new Date(row.updatedat) : null,
      deletedAt: row.deletedat ? new Date(row.deletedat) : null,
    };
  });
};
