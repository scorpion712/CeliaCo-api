import { ProductsService } from "../../../services/products/Product.service";
import { ProductsRepository } from "../../../repositories";
import { ActivateProductCommand } from "../../../models/request-response/products/commands";

// Create service instance
const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);

export interface ActivateProductResult {
    id: string;
}

/**
 * Handler for activating a product.
 */
export const activateProductHandler = async (command: ActivateProductCommand): Promise<ActivateProductResult> => {
    await productsService.activateProduct(command.id);
    return { id: command.id };
};
