export type UpdateProductRequest = {
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
};

export type UpdateProductResponse = {
  id: string;
};
