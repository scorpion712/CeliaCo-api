import { v4 as uuidv4 } from "uuid";
import createHttpError from "http-errors";

import { adaptGetSalesResponse, adaptGetSalesSummary } from "../../../adapters";
import pool from "../../../config/db";
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
  async createSale(sale: Sale): Promise<string> {
    const connection = await pool.getConnection();
    const saleId = uuidv4();
    try {
      await connection.beginTransaction();
      
      const query = `
        INSERT INTO sales (id, createdAt, updatedAt, total, type, iva, customerId, cae)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      const dateWhereClauses: string[] = [];
      
      if (filter.startDate) {
        dateWhereClauses.push(`s.createdat >= $${params.length + 1}`);
        params.push(filter.startDate.toISOString());
      }

      if (filter.endDate) {
        dateWhereClauses.push(`s.createdat <= $${params.length + 1}`);
        params.push(filter.endDate.toISOString());
      }

      if (filter.customerName && filter.customerName.trim().length > 0) {
        dateWhereClauses.push(`LOWER(c.name) LIKE LOWER('%' || $${params.length + 1} || '%')`);
        params.push(filter.customerName);
      }

      // Note: PostgreSQL columns are lowercase (customerid, createdat, etc.)
      // Construct full WHERE clause
      let fullWhereClause = 'FROM sales s LEFT JOIN customers c ON (s.customerid = c.id) WHERE s.deletedat IS NULL ';

      if (dateWhereClauses.length > 0) {
        const conjunction = fullWhereClause.includes("WHERE") ? "AND" : "WHERE";
        fullWhereClause += ` ${conjunction} ${dateWhereClauses.join(" AND ")}`;
      }

      fullWhereClause =
        filter.type && filter.type != 0
          ? `${fullWhereClause} AND s.type = ${filter.type}`
          : fullWhereClause;

      const countQuery = `SELECT COUNT(*) as total ${fullWhereClause}`;
      const dataQuery = `
        SELECT s.*, c.name as customer ${fullWhereClause}
        ORDER BY s.createdat DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(filter.limit, filter.offset);
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery),
        connection.query(dataQuery, params),
      ]);
      
      const total = countResult[0][0]?.total;
      const data = dataResult[0];

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
        SELECT s.id AS "saleId", s.salenumber AS "saleNumber", s.createdat, s.total, s.type, s.iva, s.cae, 
               d.product AS "productId", p.name AS "productName", d.amount, d.total AS "itemTotal", d.iva AS "itemIVA", d.category, 
               c.name AS customer, s.customerid AS "customerId" 
        FROM sales s 
        LEFT JOIN saledetails d ON s.id = d.saleid 
        LEFT JOIN products p ON d.product = p.id
        LEFT JOIN customers c ON s.customerid = c.id
        WHERE s.id = $1
      `;

      const result = await connection.query(query, [saleId]);

      const rows = (result.rows || []) as any[];

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
        saleNumber: sale.saleNumber,
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
        UPDATE sales  
        SET cae = $1, qrData = $2
        WHERE id = $3
      `;

      const params = [afip?.CAE, qrData, updatedSale.id];

      const res = await connection.query(query, params);

      const affectedRows = res.rowCount;

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
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  async getSalesSummary(
    filter: GetSalesSummaryRequest
  ): Promise<GetSalesSummaryResponse> {
    const connection = await pool.getConnection();
    try {
      const params: any[] = [];
      const dateWhereClauses: string[] = [];

      if (filter.initDate) {
        dateWhereClauses.push(`createdat >= $${params.length + 1}`);
        params.push(filter.initDate);
      }

      if (filter.endDate) {
        dateWhereClauses.push(`createdat <= $${params.length + 1}`);
        params.push(filter.endDate);
      }

      if (!filter.initDate && !filter.endDate) {
        dateWhereClauses.push(`DATE(createdat) = CURRENT_DATE`);
      }

      // Note: PostgreSQL columns are lowercase
      // Construct full WHERE clause
      let fullWhereClause = 'FROM sales s JOIN saledetails d ON s.id = d.saleid WHERE s.deletedat IS NULL ';

      if (dateWhereClauses.length > 0) {
        const conjunction = fullWhereClause.includes("WHERE") ? "AND" : "WHERE";
        fullWhereClause += ` ${conjunction} ${dateWhereClauses.join(" AND ")}`;
      }

      const dataQuery = `
        SELECT d.product as category, COUNT(s.id) AS sales_count ${fullWhereClause}
        GROUP BY d.product
        ORDER BY sales_count DESC
      `;

      const dataResult = await connection.query(dataQuery, params);

      const data = dataResult.rows;

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
        SELECT s.id, s.createdat, d.amount, d.total AS "itemTotal", d.iva AS "itemIVA", c."fiscalId" AS "customerFiscalId", c."ivaCategory" AS "customerCategory", c."idNumber" AS "customerIdNumber"  
        FROM sales s LEFT JOIN saledetails d ON s.id = d.saleid 
          LEFT JOIN customers c ON s.customerid = c.id
        WHERE s.id = $1
      `;

      const result = await connection.query(query, [saleId]);

      const rows = (result.rows || []) as any[];

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

  async getDailySalesByType(date?: string): Promise<DailySalesByType[]> {
    const connection = await pool.getConnection();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const query = `
        SELECT s.type, SUM(s.total) as total, COUNT(*) as count
        FROM sales s
        WHERE DATE(s.createdat) = $1 AND s.deletedat IS NULL
        GROUP BY s.type
      `;
      
      const result = await connection.query(query, [targetDate]);
      
      return result.rows.map((row: any) => ({
        tipo: row.type,
        total: parseFloat(row.total) || 0,
        count: parseInt(row.count) || 0,
      }));
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
      
      const placeholders = saleIds.map((_, i) => `$${i + 1}`).join(', ');
      const ids = saleIds;
      
      const query = `UPDATE sales SET "deletedAt" = NOW() WHERE id IN (${placeholders})`;
      
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
      await connection.query(`DELETE FROM "SaleDetails" WHERE "saleId" = $1`, [saleId]);
      
      // Delete sale
      await connection.query(`DELETE FROM sales WHERE id = $1`, [saleId]);
    } catch (error) {
      throw new Error(`Database error: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }
}
