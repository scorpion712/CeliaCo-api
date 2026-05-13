import { v4 as uuidv4 } from "uuid";
import createHttpError from "http-errors";

import pool, { databaseType } from "../../../config/db";
import {
  CreateProductCommand,
  GetProductsCommand,
  UpdateProductCommand,
} from "../../../models/request-response/products/commands";
import { IProductsRepository } from "../IProductsRepository.interface";
import { GetProduct } from "../models/GetProduct";
import { adaptGetProductsResponse } from "../../../adapters/products/GetProducts.adapter";

export class ProductsRepository implements IProductsRepository {
  async createProduct(request: CreateProductCommand): Promise<string> {
    const {
      name,
      code,
      description,
      costPrice,
      salePrice,
      stock,
      category,
      isEnabled,
      allowSaleWithoutStock,
      stockMandatory,
    } = request;
    const connection = await pool.getConnection();

    const checkQuery =
      databaseType === "postgresql"
        ? "SELECT * FROM products WHERE LOWER(name) ILIKE LOWER($1)"
        : "SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)";

    const checkParams = databaseType === "postgresql" ? [name] : [name];
    const res = await connection.query(checkQuery, checkParams);

    const exists =
      databaseType === "postgresql"
        ? res.rows?.length > 0
        : res[0]?.length > 0;

    if (exists) {
      connection.release();
      throw createHttpError(400, `Ya existe un producto con ese nombre`);
    }

    try {
      await connection.beginTransaction();

      const productId = uuidv4();
      const productCode = code ?? productId.substring(0, 8);
      const productDescription = description ?? "";
      const productCostPrice = costPrice ?? 0;
      const productSalePrice = salePrice ?? 0;
      const productStock = stock ?? 0;
      const productCategory = category ?? "";
      const productEnabled = isEnabled ?? true;
      const productAllowSale = allowSaleWithoutStock ?? false;
      const productStockMandatory = stockMandatory ?? false;

      if (databaseType === "postgresql") {
        const query = `
          INSERT INTO products (id, code, name, description, costPrice, salePrice, stock, category, isEnabled, allowSaleWithoutStock, stockMandatory, createdAt, updatedAt)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `;
        await connection.query(query, [
          productId,
          productCode,
          name,
          productDescription,
          productCostPrice,
          productSalePrice,
          productStock,
          productCategory,
          productEnabled,
          productAllowSale,
          productStockMandatory,
        ]);
      } else {
        const query = `
          INSERT INTO products (id, code, name, description, costPrice, salePrice, stock, category, isEnabled, allowSaleWithoutStock, stockMandatory, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        await connection.query(query, [
          productId,
          productCode,
          name,
          productDescription,
          productCostPrice,
          productSalePrice,
          productStock,
          productCategory,
          productEnabled,
          productAllowSale,
          productStockMandatory,
        ]);
      }

      await connection.commit();

      return productId;
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar crear el producto`,
      );
    } finally {
      connection.release();
    }
  }

  async getProducts(filter: GetProductsCommand): Promise<GetProduct> {
    const connection = await pool.getConnection();
    try {
      const params: any[] = [];
      let whereClause = "WHERE deletedAt IS NULL";

      // Filter by deletion status based on status
      if (filter.status === "inactive") {
        whereClause = "WHERE deletedAt IS NOT NULL";
      }

      // Search filter
      if (filter.search) {
        const searchCondition =
          databaseType === "postgresql"
            ? " AND (LOWER(name) ILIKE $1 OR LOWER(code) ILIKE $1)"
            : " AND (LOWER(name) LIKE $1 OR LOWER(code) LIKE $1)";
        whereClause += searchCondition;
        params.push(`%${filter.search}%`);
      }

      // Stock filter
      if (filter.stock && filter.stock !== "all") {
        switch (filter.stock) {
          case "in_stock":
            whereClause += " AND stock > 0";
            break;
          case "low_stock":
            whereClause += " AND stock > 0 AND stock <= 10";
            break;
          case "out_of_stock":
            whereClause += " AND stock <= 0";
            break;
        }
      }

      // Category filter
      if (filter.category && filter.category !== "all") {
        const categoryCondition =
          databaseType === "postgresql"
            ? " AND category = $1"
            : " AND category = ?";
        whereClause += categoryCondition;
        if (params.length > 0) {
          params.push(filter.category);
        }
      }

      let countQuery: string;
      let dataQuery: string;

      if (databaseType === "postgresql") {
        countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
        dataQuery = `
          SELECT * FROM products ${whereClause}
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
      } else {
        countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
        dataQuery = `
          SELECT * FROM products ${whereClause}
          LIMIT ? OFFSET ?
        `;
      }

      params.push(filter.limit, filter.offset);
      const [countResult, dataResult] = await Promise.all([
        connection.query(
          countQuery,
          params.slice(
            0,
            databaseType === "postgresql"
              ? params.length - 2
              : params.length,
          ),
        ),
        connection.query(dataQuery, params),
      ]);

      const total =
        databaseType === "postgresql"
          ? countResult[0][0]?.total
          : countResult.rows[0]?.total;

      const data =
        databaseType === "postgresql" ? dataResult[0] : dataResult.rows;

      return {
        data: adaptGetProductsResponse(data),
        total: total,
      } as GetProduct;
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

async updateProduct(request: UpdateProductCommand): Promise<any> {
    const {
      id,
      name,
      code,
      description,
      costPrice,
      salePrice,
      stock,
      category,
      isEnabled,
      allowSaleWithoutStock,
      stockMandatory,
    } = request;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Build SET clause with actual values, not placeholders
      const updates: string[] = [];
      const params: any[] = [];

      if (code !== undefined) {
        params.push(code);
        updates.push(`code = $${params.length}`);
      }
      if (name !== undefined) {
        params.push(name);
        updates.push(`name = $${params.length}`);
      }
      if (description !== undefined) {
        params.push(description);
        updates.push(`description = $${params.length}`);
      }
      if (costPrice !== undefined) {
        params.push(costPrice);
        updates.push(`costPrice = $${params.length}`);
      }
      if (salePrice !== undefined) {
        params.push(salePrice);
        updates.push(`salePrice = $${params.length}`);
      }
      if (stock !== undefined) {
        params.push(stock);
        updates.push(`stock = $${params.length}`);
      }
      if (category !== undefined) {
        params.push(category);
        updates.push(`category = $${params.length}`);
      }
      if (isEnabled !== undefined) {
        params.push(isEnabled);
        updates.push(`isEnabled = $${params.length}`);
      }
      if (allowSaleWithoutStock !== undefined) {
        params.push(allowSaleWithoutStock);
        updates.push(`allowSaleWithoutStock = $${params.length}`);
      }
      if (stockMandatory !== undefined) {
        params.push(stockMandatory);
        updates.push(`stockMandatory = $${params.length}`);
      }

      updates.push(`updatedAt = NOW()`);

      // Add id as last parameter
      params.push(id);
      const idParamIndex = params.length;

      let query: string;
      if (databaseType === "postgresql") {
        query = `UPDATE products SET ${updates.join(", ")} WHERE id = $${idParamIndex}`;
      } else {
        query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
      }

      const res = await connection.query(query, params);

      const affectedRows =
        databaseType === "postgresql" ? res.rowCount : res[0].affectedRows;

      if (affectedRows == 0) {
        throw createHttpError(404, `No se encontró el producto`);
      }

      await connection.commit();

      return { id: request.id };
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar actualizar el producto`,
      );
    } finally {
      connection.release();
    }
  }

  async deleteProduct(productId: string): Promise<string> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let query: string;
      if (databaseType === "postgresql") {
        query = `
          UPDATE products  
          SET deletedAt = NOW()
          WHERE id = $1
        `;
      } else {
        query = `
          UPDATE products  
          SET deletedAt = NOW()
          WHERE id = ?
        `;
      }

      const res = await connection.query(query, [productId]);

      const affectedRows =
        databaseType === "postgresql" ? res.rowCount : res[0].affectedRows;

      if (affectedRows == 0) {
        throw createHttpError(404, `No se encontró el producto a eliminar`);
      }

      await connection.commit();

      return productId;
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar eliminar el producto`,
      );
    } finally {
      connection.release();
    }
  }

  async activateProduct(productId: string): Promise<string> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let query: string;
      if (databaseType === "postgresql") {
        query = `
          UPDATE products  
          SET deletedAt = NULL, updatedAt = NOW()
          WHERE id = $1
        `;
      } else {
        query = `
          UPDATE products  
          SET deletedAt = NULL, updatedAt = NOW()
          WHERE id = ?
        `;
      }

      const res = await connection.query(query, [productId]);

      const affectedRows =
        databaseType === "postgresql" ? res.rowCount : res[0].affectedRows;

      if (affectedRows == 0) {
        throw createHttpError(404, `No se encontró el producto a activar`);
      }

      await connection.commit();

      return productId;
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar activar el producto`,
      );
    } finally {
      connection.release();
    }
  }
}
