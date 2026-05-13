import { CreateProductRequest, GetProductsRequest, GetProductsResponse, Product, UpdateProductRequest, UpdateProductResponse } from "../../models";
import { GetProduct } from "./models/GetProduct";
import { UpdateProduct } from "./models/UpdateProduct";

export interface IProductsRepository {
  createProduct(product: CreateProductRequest): Promise<string>;
  getProducts(filter: GetProductsRequest): Promise<GetProduct>;
  updateProduct(request: UpdateProductRequest): Promise<UpdateProduct>;
  deleteProduct(productId: string): Promise<string>;
  activateProduct(productId: string): Promise<string>;
}
