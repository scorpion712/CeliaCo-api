import { ProductsService } from "../../../services/products/Product.service";
import { ProductsRepository } from "../../../repositories";
import { DeleteProductCommand } from "../../../models/request-response/products/commands";

// Create service instance
const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);

export interface DeleteProductResult {
    id: string;
}

/**
 * Handler for deleting (soft delete) a product.
 */
export const deleteProductHandler = async (command: DeleteProductCommand): Promise<DeleteProductResult> => {
    await productsService.deleteProduct(command.id);
    return { id: command.id };
};
