import { PaginatedRequest, PaginatedResponse } from "../Paginated";

export type GetProductsRequest = PaginatedRequest & {
  search?: string;
  stock?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  status?: "all" | "active" | "inactive";
  category?: string;
};

export type GetProductsResponse = PaginatedResponse<Product>;

type Product = {
  id: string;
  code: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  category: string;
  isEnabled: boolean;
  allowSaleWithoutStock: boolean;
  stockMandatory: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};
