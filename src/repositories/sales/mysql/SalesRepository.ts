import { v4 as uuidv4 } from "uuid";
import createHttpError from "http-errors";

import { adaptGetSalesResponse, adaptGetSalesSummary } from "../../../adapters";
import pool, { databaseType } from "../../../config/db";
import {
  GetSalesRequest,
  GetSalesResponse,
  GetSalesSummaryRequest,
  GetSalesSummaryResponse,
  Sale,
  UpdateSaleRequest,
} from "../../../models";
import { DailySalesByType, ISalesRepository } from "../ISalesRepository.interface";
import { GetSale } from "../models/GetSale";
import { GetFiscalSale } from "../models/GetFiscalSale";

export class SalesRepository implements ISalesRepository {
  getDailySalesByType(date?: string): Promise<DailySalesByType[]> {
    throw new Error("Method not implemented.");
  }
  async createSale(sale: Sale): Promise<string> {
    const connection = await pool.getConnection();
    const saleId = uuidv4();
    try {
      await connection.beginTransaction();
      
      const query = `
        INSERT INTO sales (id, createdAt, updatedAt, total, type, iva, customerId, cae)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [saleId, new Date(), new Date(), sale.total, sale.type, sale.iva, sale.customerId, sale.cae];

      await connection.query(query, params);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error(error);

      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar crear la venta`
      );
    } finally {
      connection.release();
    }

    return saleId;
  }

  async getSales(filter: GetSalesRequest): Promise<GetSalesResponse> {
    const connection = await pool.getConnection();
    try {
      const params: any[] = [];
      const whereClauses: string[] = [];

      if (filter.startDate) {
        whereClauses.push(`s.createdAt >= '${filter.startDate.toISOString()}'`);
      }

      if (filter.endDate) {
        whereClauses.push(`s.createdAt <= '${filter.endDate.toISOString()}'`);
      }

      if (filter.customerName && filter.customerName.trim().length > 0) {
        whereClauses.push(
          `LOWER(c.name) LIKE LOWER(CONCAT('%', '${filter.customerName}', '%'))`
        );
      }

      // Construct full WHERE clause
      let fullWhereClause = 'FROM sales s LEFT JOIN customers c ON (s.CustomerId = c.Id) WHERE s.deletedAt IS NULL ';

      if (whereClauses.length > 0) {
        fullWhereClause += ` AND ${whereClauses.join(" AND ")}`;
      }

      if (filter.type && filter.type != 0) {
        fullWhereClause += ` AND s.type = ${filter.type}`;
      }

      const countQuery = `SELECT COUNT(*) as total ${fullWhereClause}`;
      const dataQuery = `
        SELECT s.*, c.name as 'customer' ${fullWhereClause}
        ORDER BY s.createdAt DESC
        LIMIT ? OFFSET ?
      `;

      params.push(filter.limit, filter.offset);

      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery),
        connection.query(dataQuery, params),
      ]);
      
      const total = databaseType === 'postgresql' 
        ? countResult[0][0]?.total 
        : countResult.rows[0]?.total;
      const data = databaseType === 'postgresql' 
        ? dataResult[0] 
        : dataResult.rows;

      return {
        data: adaptGetSalesResponse(data) as any,
        pagination: {
          total,
          page: Math.floor(filter.offset / filter.limit) + 1,
          pageSize: filter.limit,
          totalPages: Math.ceil(total / filter.limit),
        },
      } as GetSalesResponse;
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async getSaleById(saleId: string): Promise<GetSale> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT s.Id AS saleId, s.createdAt, s.total, s.type, s.iva, s.cae, 
               d.product AS productId, p.name AS productName, d.amount, d.total AS itemTotal, d.iva AS itemIVA, d.category, 
               c.name AS customer, c.id AS customerId 
        FROM sales s 
        LEFT JOIN saleDetails d ON s.id = d.saleId 
        LEFT JOIN products p ON d.product = p.id
        LEFT JOIN customers c ON s.customerId = c.id
        WHERE s.id = ?
      `;

      const result = await connection.query(query, [saleId]);

      // Handle both MySQL (result.rows) and PostgreSQL (result[0]) formats
      const rows = databaseType === 'postgresql' ? (result[0] || []) as any[] : (result.rows || []) as any[];
      
      if (!rows || rows.length === 0) {
        throw new Error('Sale not found');
      }

      const sale = rows[0];

      const items = rows.map((row: any) => ({
        productId: row.productId,
        productName: row.productName,
        category: row.category,
        amount: row.amount,
        itemTotal: row.itemTotal,
        itemIVA: row.itemIVA,
      }));

      return {
        id: sale.saleId,
        createdAt: sale.createdAt,
        total: sale.total,
        customer: sale.customer,
        customerId: sale.customerId,
        cae: sale.cae,
        type: sale.type,
        iva: sale.iva,
        items,
      } as GetSale;
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async updateSale(updatedSale: UpdateSaleRequest): Promise<Sale | null> {
    if (!updatedSale.arcaData) return null;
    const { afip, nroCbte, qrData } = updatedSale.arcaData;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const query = `
        UPDATE Sales  
        SET cae = ?, qrData = ?
        WHERE id = ?
      `;

      const params = [afip?.CAE, qrData, updatedSale.id];

      const res = await connection.query(query, params);

      const affectedRows = res[0].affectedRows;

      if (affectedRows == 0)
        throw createHttpError(404, `No se encontró la venta`);

      await connection.commit();

      return { id: updatedSale.id } as Sale;
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar actualizar el cliente`
      );
    } finally {
      connection.release();
    } 
  }

  deleteSale(saleId: string): Promise<void> {
    return this.deleteSales([saleId]);
  }

  async getSalesSummary(
    filter: GetSalesSummaryRequest
  ): Promise<GetSalesSummaryResponse> {
    const connection = await pool.getConnection();
    try {
      const whereClauses: string[] = [];

      if (filter.initDate) {
        whereClauses.push(`createdAt >= ?`);
      }

      if (filter.endDate) {
        whereClauses.push(`createdAt <= ?`);
      }

      if (!filter.initDate && !filter.endDate) {
        whereClauses.push(`DATE(createdAt) = CURDATE()`);
      }

      // Construct full WHERE clause
      let fullWhereClause = 'FROM sales s JOIN SaleDetails d ON s.id = d.saleId WHERE s.deletedAt IS NULL ';

      if (whereClauses.length > 0) {
        fullWhereClause += ` AND ${whereClauses.join(" AND ")}`;
      }

      const dataQuery = `
        SELECT d.product as category, COUNT(s.id) AS sales_count ${fullWhereClause}
        GROUP BY d.product
        ORDER BY sales_count DESC
      `;

      const params = [filter.initDate, filter.endDate].filter(Boolean);
      const dataResult = await connection.query(dataQuery, params);

      const data = dataResult[0];

      return {
        data: adaptGetSalesSummary(data),
      } as GetSalesSummaryResponse;
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async getFiscalSaleById(saleId: string): Promise<GetFiscalSale> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT s.Id, s.createdAt, d.amount, d.total AS itemTotal, d.iva AS itemIVA, c.fiscalId AS customerFiscalId, c.ivaCategory AS customerCategory, c.idNumber AS customerIdNumber  
        FROM sales s LEFT JOIN saleDetails d ON s.id = d.saleId 
          LEFT JOIN customers c ON s.customerId = c.id
        WHERE s.id = ?
      `;

      const result = await connection.query(query, [saleId]);

      const rows = databaseType === 'postgresql' ? (result[0] || []) as any[] : (result.rows || []) as any[];

      if (!rows || rows.length === 0) {
        throw new Error('Sale not found');
      }

      const sale = rows[0];

      const items = rows.map((row: any) => ({
        amount: row.amount,
        itemTotal: row.itemTotal,
        itemIVA: row.itemIVA,
      }));

      return {
        id: sale.id,
        createdAt: sale.createdAt,
        customerCategory: sale.customerCategory,
        customerFiscalId: sale.customerFiscalId,
        customerIdNumber: sale.customerIdNumber,
        items,
      } as GetFiscalSale;
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  // Soft delete sales (mark as deleted)
  async deleteSales(saleIds: string[]): Promise<void> {
    const connection = await pool.getConnection();
    try {
      if (saleIds.length === 0) return;
      
      const placeholders = saleIds.map((_, i) => databaseType === 'postgresql' ? `$${i + 1}` : '?').join(', ');
      const ids = saleIds;
      
      let query: string;
      if (databaseType === 'postgresql') {
        query = `UPDATE sales SET "deletedAt" = NOW() WHERE id IN (${placeholders})`;
      } else {
        query = `UPDATE sales SET deletedAt = NOW() WHERE id IN (${placeholders})`;
      }
      
      await connection.query(query, ids);
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  // Hard delete (permanent removal)
  async hardDeleteSale(saleId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      // Delete sale details first
      let detailsQuery: string;
      if (databaseType === 'postgresql') {
        detailsQuery = `DELETE FROM "SaleDetails" WHERE "saleId" = $1`;
      } else {
        detailsQuery = `DELETE FROM SaleDetails WHERE saleId = ?`;
      }
      await connection.query(detailsQuery, [saleId]);
      
      // Delete sale
      let saleQuery: string;
      if (databaseType === 'postgresql') {
        saleQuery = `DELETE FROM sales WHERE id = $1`;
      } else {
        saleQuery = `DELETE FROM sales WHERE id = ?`;
      }
      await connection.query(saleQuery, [saleId]);
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }
}
