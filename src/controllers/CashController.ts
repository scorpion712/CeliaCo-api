import { Request, Response } from "express";
import pool, { databaseType } from "../config/db";

export interface CashSummary {
  countContado: number;
  countFiscal: number;
  countCuenta: number;
  totalContado: number;
  totalFiscal: number;
  totalCuenta: number;
  totalCount: number;
  totalGeneral: number;
}

export interface CashInfo {
  summary: CashSummary;
  lastSales: any[];
}

export const CashController = {
  /**
   * GET /cash - Get today's cash summary and last 10 sales
   * 1. Get all today's sales by type (contado, fiscal, cuenta)
   * 2. Sum total (contado + fiscal = efectivo)
   * 3. Last 10 sales ordered DESC
   */
  getCashInfo: async (req: Request, res: any, next: any) => {
    const connection = await pool.getConnection();
    
    try {
      const isPostgreSQL = databaseType === 'postgresql';
      
      // Get current date for debugging
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Summary query - get today's totals by type
      // Use explicit date comparison to avoid timezone issues
      let summaryQuery: string;
      
      if (isPostgreSQL) {
        summaryQuery = `
          SELECT 
            COALESCE(SUM(CASE WHEN type = 1 THEN total ELSE 0 END), 0) as total_contado,
            COALESCE(SUM(CASE WHEN type = 2 THEN total ELSE 0 END), 0) as total_fiscal,
            COALESCE(SUM(CASE WHEN type = 3 THEN total ELSE 0 END), 0) as total_cuenta,
            COUNT(*) as total_transacciones,
            COALESCE(SUM(total), 0) as total_dia
          FROM sales 
          WHERE createdat::date = $1 AND deletedat IS NULL`;
      } else {
        summaryQuery = `
          SELECT 
            COALESCE(SUM(CASE WHEN type = 1 THEN total ELSE 0 END), 0) as total_contado,
            COALESCE(SUM(CASE WHEN type = 2 THEN total ELSE 0 END), 0) as total_fiscal,
            COALESCE(SUM(CASE WHEN type = 3 THEN total ELSE 0 END), 0) as total_cuenta,
            COUNT(*) as total_transacciones,
            COALESCE(SUM(total), 0) as total_dia
          FROM sales 
          WHERE DATE(createdAt) = $1 AND deletedAt IS NULL`;
      }
      
      // Last 10 sales - ordered DESC (most recent first)
      let salesQuery: string;
      
      if (isPostgreSQL) {
        salesQuery = `
          SELECT s.id, s.createdat, s.total, s.type, s.iva, COALESCE(c.name, 'Consumidor Final') as customer
          FROM sales s
          LEFT JOIN customers c ON s.customerid = c.id
          WHERE s.createdat::date = $1 AND s.deletedat IS NULL
          ORDER BY s.createdat DESC
          LIMIT 10`;
      } else {
        salesQuery = `
          SELECT s.id, s.createdAt, s.total, s.type, s.iva, COALESCE(c.name, 'Consumidor Final') as customer
          FROM sales s
          LEFT JOIN customers c ON s.customerId = c.id
          WHERE DATE(s.createdAt) = $1 AND s.deletedAt IS NULL
          ORDER BY s.createdAt DESC
          LIMIT 10`;
      }
      
      
      const [summaryResult, salesResult] = await Promise.all([
        connection.query(summaryQuery, [todayDate]),
        connection.query(salesQuery, [todayDate]),
      ]);
      
      
      // Get data from array results
      const summary = Array.isArray(summaryResult) && summaryResult[0] ? summaryResult[0][0] : null;
      const salesData = Array.isArray(salesResult) && salesResult[0] ? salesResult[0] : [];
      
      // Calculate efectivo (contado + fiscal)
      const totalContado = parseFloat(summary?.total_contado) || 0;
      const totalFiscal = parseFloat(summary?.total_fiscal) || 0;
      const totalEfectivo = totalContado + totalFiscal;
      
      const response: CashInfo = {
        summary: {
          countContado: parseInt(summary?.count_contado) || 0,
          countFiscal: parseInt(summary?.count_fiscal) || 0,
          countCuenta: parseInt(summary?.count_cuenta) || 0,
          totalContado: totalContado,
          totalFiscal: totalFiscal,
          totalCuenta: parseFloat(summary?.total_cuenta) || 0,
          totalCount: parseInt(summary?.total_transacciones) || 0,
          totalGeneral: totalEfectivo,
        },
        lastSales: salesData.map((row: any) => ({
          id: row.id,
          createdAt: row.createdat || row.createdAt,
          total: parseFloat(row.total),
          type: row.type,
          iva: parseFloat(row.iva) || 0,
          customer: row.customer,
        })),
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error("Error getting cash info:", error);
      res.status(500).json({ error: "Error al obtener información de caja" });
    } finally {
      connection.release();
    }
  },
};