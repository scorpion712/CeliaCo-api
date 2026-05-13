import { Request } from "express";

import { adaptCreateProduct } from "../adapters/products/CreateProduct.adapter";
import { adaptGetProducts } from "../adapters/products/GetProducts.adapter";
import { adaptUpdateProduct } from "../adapters/products/UpdateProduct.adapter";
import { adaptDeleteProduct } from "../adapters/products/DeleteProduct.adapter";
import { adaptActivateProduct } from "../adapters/products/ActivateProduct.adapter";

import { createProductHandler } from "../handlers/products/create/createProduct.handler";
import { getProductsHandler } from "../handlers/products/get/getProducts.handler";
import { updateProductHandler } from "../handlers/products/update/updateProduct.handler";
import { deleteProductHandler } from "../handlers/products/delete/deleteProduct.handler";
import { activateProductHandler } from "../handlers/products/activate/activateProduct.handler";

import { ProductsService } from "../services/products/Product.service";
import { ProductsRepository } from "../repositories";

const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);

export const ProductsController = {
  createProduct: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptCreateProduct(req);
      const result = await createProductHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getProducts: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptGetProducts(req);
      const result = await getProductsHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getAllProducts: async (req: Request, res: any, next: any) => {
    try {
      const result = await productsService.getProducts({
        limit: 1000,
        offset: 0,
      });
      res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  },

  searchProducts: async (req: Request, res: any, next: any) => {
    try {
      const query = req.query.q as string;
      const result = await productsService.getProducts({
        limit: 100,
        offset: 0,
        search: query,
        status: "active",
      });
      res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  },

  getLowStockProducts: async (req: Request, res: any, next: any) => {
    try {
      const threshold = Number(req.query.threshold) || 10;
      const result = await productsService.getProducts({
        limit: 100,
        offset: 0,
        stock: "low_stock",
        status: "active",
      });
      res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  },

  getCategories: async (req: Request, res: any, next: any) => {
    try {
      const result = await productsService.getProducts({
        limit: 1000,
        offset: 0,
        status: "active",
      });
      const categories = [
        ...new Set(result.data.map((p: any) => p.category).filter(Boolean)),
      ];
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  },

  getProductByCode: async (req: Request, res: any, next: any) => {
    try {
      const code = req.params.code as string;
      const result = await productsService.getProducts({
        limit: 1,
        offset: 0,
        search: code,
        status: "active",
      });
      const product = result.data.find((p: any) => p.code === code);
      if (product) {
        res.status(200).json(product);
      } else {
        res.status(200).json(null);
      }
    } catch (error) {
      next(error);
    }
  },

  codigoExists: async (req: Request, res: any, next: any) => {
    try {
      const code = (req.query.code as string) || "";
      const excludeId = (req.query.excludeId as string) || "";
      const result = await productsService.getProducts({
        limit: 1000,
        offset: 0,
        search: code,
        status: "active",
      });
      const exists = result.data.some(
        (p: any) => p.code === code && p.id !== excludeId,
      );
      res.status(200).json(exists);
    } catch (error) {
      next(error);
    }
  },

  updateProduct: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptUpdateProduct(req);
      const productId = req.params.id as string;
      const result = await updateProductHandler(productId, command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  toggleActive: async (req: Request, res: any, next: any) => {
    try {
      const productId = req.params.id as string;
      const result = await productsService.toggleActive(productId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  updateStock: async (req: Request, res: any, next: any) => {
    try {
      const productId = req.params.id as string;
      const { quantity, operation } = req.body;
      const result = await productsService.updateStock(
        productId,
        quantity,
        operation,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteProduct: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptDeleteProduct(req);
      const result = await deleteProductHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  activateProduct: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptActivateProduct(req);
      const result = await activateProductHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
