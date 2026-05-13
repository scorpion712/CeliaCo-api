import { v4 as uuidv4 } from "uuid";

import { ISaleDetailsRepository } from "../ISaleDetailsRepository";
import pool, { databaseType } from "../../../config/db";
import createHttpError from "http-errors";
import { SalesCartItem } from "../../../models";

export class SaleDetailsRepository implements ISaleDetailsRepository {
  async createSaleDetail(cartItems: SalesCartItem[]): Promise<string> {
    const connection = await pool.getConnection();

    if (!cartItems || cartItems.length === 0) {
      throw createHttpError(400, 'No items provided in cart');
    }

    try {
      await connection.beginTransaction();

      // Use a single insert with all items at once for better performance
      const values: any[] = [];
      const placeholders: string[] = [];

      cartItems.forEach((cartItem, index) => {
        const id = uuidv4();
        const { saleId, description: product, qty, total, ivaPct } = cartItem;
        
        // Validate IDs are proper UUIDs (36 characters)
        if (!id || id.length !== 36) {
          throw createHttpError(400, `Invalid detail ID: ${id}`);
        }
        if (!saleId || saleId.length !== 36) {
          throw createHttpError(400, `Invalid sale ID: ${saleId}`);
        }
        
        // Truncate product name - use 36 characters to match database VARCHAR(36) limit
        const safeProduct = (product || '').trim().substring(0, 36);
        // Debug: console.log('[SaleDetails] product:', safeProduct, 'len:', safeProduct.length);
        if (!safeProduct) {
          throw createHttpError(400, `Product name is required`);
        }
        
        if (databaseType === 'postgresql') {
          placeholders.push(`($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`);
        } else {
          // MySQL needs 6 values: id, saleId, product, amount, total, iva
          placeholders.push(`(?, ?, ?, ?, ?, ?)`);
        }
        
        values.push(id, saleId, safeProduct, qty, total, ivaPct);
      });

      const tableName = databaseType === 'postgresql' ? 'saledetails' : 'saleDetails';
      const query = `
        INSERT INTO ${tableName} (id, saleId, product, amount, total, iva)
        VALUES ${placeholders.join(', ')}
      `;

      // Debug: console.log('[SaleDetails] Inserting', query, values);
      await connection.query(query, values);

      await connection.commit();

      return cartItems[0].saleId;
    } catch (error) {
      await connection.rollback();
      console.error('[SaleDetails] Error details:', error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar guardar el detalle de venta: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      connection.release();
    }
  }
}