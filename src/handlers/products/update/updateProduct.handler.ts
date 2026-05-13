import { ProductsService } from "../../../services/products/Product.service";
import { ProductsRepository } from "../../../repositories";
import { UpdateProductCommand } from "../../../models/request-response/products/commands";

const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);

export interface UpdateProductResult {
  id: string;
}

export const updateProductHandler = async (
  productId: string,
  command: UpdateProductCommand,
): Promise<UpdateProductResult> => {
  const result = await productsService.updateProduct(productId, command);
  return { id: productId };
};
