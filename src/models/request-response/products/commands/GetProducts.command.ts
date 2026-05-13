export interface GetProductsCommand {
  limit: number;
  offset: number;
  search?: string;
  stock?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  status?: "all" | "active" | "inactive";
  category?: string;
}
