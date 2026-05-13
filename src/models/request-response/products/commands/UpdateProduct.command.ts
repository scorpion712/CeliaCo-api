export interface UpdateProductCommand {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  category?: string;
  isEnabled?: boolean;
  allowSaleWithoutStock?: boolean;
  stockMandatory?: boolean;
}
