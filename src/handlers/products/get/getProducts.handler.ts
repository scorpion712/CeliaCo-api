import { ProductsService } from "../../../services/products/Product.service";
import { ProductsRepository } from "../../../repositories";
import { GetProductsCommand } from "../../../models/request-response/products/commands";
import { GetProductsResponse } from "../../../models";

const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);

export const getProductsHandler = async (
  command: GetProductsCommand,
): Promise<GetProductsResponse> => {
  return productsService.getProducts({
    limit: command.limit,
    offset: command.offset,
    search: command.search,
    stock: command.stock,
    status: command.status,
    category: command.category,
  });
};
