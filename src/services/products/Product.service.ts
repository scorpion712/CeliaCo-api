import { adaptGetProductsResponse } from "../../adapters";
import {
  GetProductsCommand,
  CreateProductCommand,
  UpdateProductCommand,
} from "../../models/request-response/products/commands";
import { GetProductsResponse } from "../../models/request-response/products";
import { IProductsRepository } from "../../repositories";

export class ProductsService {
  constructor(private productRepository: IProductsRepository) {}

  async createProduct(command: CreateProductCommand) {
    return await this.productRepository.createProduct({
      code: command.code,
      name: command.name,
      description: command.description,
      costPrice: command.costPrice,
      salePrice: command.salePrice,
      stock: command.stock,
      category: command.category,
      isEnabled: command.isEnabled,
      allowSaleWithoutStock: command.allowSaleWithoutStock,
      stockMandatory: command.stockMandatory,
    });
  }

  async getProducts(command: GetProductsCommand) {
    const products = await this.productRepository.getProducts(command);
    return {
      data: products.data,
      pagination: {
        total: products.total,
        page: Math.floor(command.offset / command.limit) + 1,
        pageSize: command.limit,
        totalPages: Math.ceil(products.total / command.limit),
      },
    } as GetProductsResponse;
  }

  async updateProduct(productId: string, command: UpdateProductCommand) {
    return await this.productRepository.updateProduct({
      id: productId,
      code: command.code,
      name: command.name,
      description: command.description,
      costPrice: command.costPrice,
      salePrice: command.salePrice,
      stock: command.stock,
      category: command.category,
      isEnabled: command.isEnabled,
      allowSaleWithoutStock: command.allowSaleWithoutStock,
      stockMandatory: command.stockMandatory,
    });
  }

  async deleteProduct(productId: string) {
    return await this.productRepository.deleteProduct(productId);
  }

  async activateProduct(productId: string) {
    return await this.productRepository.activateProduct(productId);
  }

  async toggleActive(productId: string) {
    const products = await this.productRepository.getProducts({
      limit: 1,
      offset: 0,
    });
    const product = products.data.find((p) => (p as any).id === productId);
    if (product && (product as any).isEnabled) {
      return await this.productRepository.deleteProduct(productId);
    } else {
      return await this.productRepository.activateProduct(productId);
    }
  }

  async updateStock(
    productId: string,
    quantity: number,
    operation: "add" | "subtract" | "set",
  ) {
    const products = await this.productRepository.getProducts({
      limit: 1,
      offset: 0,
    });
    const product = products.data.find((p) => (p as any).id === productId);

    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const currentStock = (product as any).stock;
    let newStock: number;

    switch (operation) {
      case "add":
        newStock = currentStock + quantity;
        break;
      case "subtract":
        newStock = currentStock - quantity;
        break;
      case "set":
        newStock = quantity;
        break;
    }

    return await this.productRepository.updateProduct({
      id: productId,
      stock: newStock,
    } as UpdateProductCommand);
  }
}
