import { ProductsService } from "../../../services/products/Product.service";
import { ProductsRepository } from "../../../repositories";
import { CreateProductCommand } from "../../../models/request-response/products/commands";
import { Product } from "../../../models";

// Create service instance (or use dependency injection in larger apps)
const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);

export interface CreateProductResult {
    id: string;
}

/**
 * Handler for creating a product.
 */
export const createProductHandler = async (command: CreateProductCommand): Promise<CreateProductResult> => {
    const productId = await productsService.createProduct(command as Product);
    return { id: productId };
};
