import pool, { databaseType } from "../../config/db";
import { DashboardInfo } from "../../models/request-response/dashboard/DashboardInfo";

export class DashboardService {
  async getDashboardInfo(): Promise<DashboardInfo> {
    const connection = await pool.getConnection();

    try {
      // Get today's date for query
      const todayDate = new Date().toISOString().split('T')[0];

      // 1. VENTAS DE HOY - transacciones y monto total
      let todaySalesQuery: string;
      
      if (databaseType === "postgresql") {
        todaySalesQuery = `
          SELECT 
            COUNT(*) as transacciones,
            COALESCE(SUM(total), 0) as monto_total
          FROM sales
          WHERE createdat::date = $1 AND deletedat IS NULL
        `;
      } else {
        todaySalesQuery = `
          SELECT 
            COUNT(*) as transacciones,
            COALESCE(SUM(total), 0) as monto_total
          FROM sales
          WHERE DATE(createdAt) = $1 AND deletedAt IS NULL
        `;
      }

      const todaySalesResult = await connection.query(todaySalesQuery, [todayDate]);
      const todaySales = Array.isArray(todaySalesResult) && todaySalesResult[0] 
        ? todaySalesResult[0][0] 
        : null;

      // 2. CUENTAS PENDIENTES - clientes con saldo > 0 y total adeudado
      let pendingAccountsQuery: string;
      
      if (databaseType === "postgresql") {
        pendingAccountsQuery = `
          SELECT 
            COUNT(*) as clientes_pendientes,
            COALESCE(SUM(saldo_actual), 0) as total_adeudado
          FROM cuentas_corrientes
          WHERE saldo_actual > 0 AND "deletedAt" IS NULL
        `;
      } else {
        pendingAccountsQuery = `
          SELECT 
            COUNT(*) as clientes_pendientes,
            COALESCE(SUM(saldo_actual), 0) as total_adeudado
          FROM cuentas_corrientes
          WHERE saldo_actual > 0 AND deletedAt IS NULL
        `;
      }

      const pendingAccountsResult = await connection.query(pendingAccountsQuery);
      const pendingAccounts = Array.isArray(pendingAccountsResult) && pendingAccountsResult[0]
        ? pendingAccountsResult[0][0]
        : null;

      // 3. PRODUCTOS - total registrados y sin stock
      let productsQuery: string;
      
      if (databaseType === "postgresql") {
        productsQuery = `
          SELECT 
            COUNT(*) as total_productos,
            COUNT(*) FILTER (WHERE stock = 0) as sin_stock
          FROM products
          WHERE deletedat IS NULL
        `;
      } else {
        productsQuery = `
          SELECT 
            COUNT(*) as total_productos,
            SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as sin_stock
          FROM products
          WHERE deletedAt IS NULL
        `;
      }

      const productsResult = await connection.query(productsQuery);
      const products = Array.isArray(productsResult) && productsResult[0]
        ? productsResult[0][0]
        : null;

      return {
        sales: {
          transaccionesHoy: todaySales ? Number(todaySales.transacciones) || 0 : 0,
          totalVentasHoy: todaySales ? Number(todaySales.monto_total) || 0 : 0,
        },
        accounts: {
          cuentasPendientes: pendingAccounts ? Number(pendingAccounts.clientes_pendientes) || 0 : 0,
          totalAdeudado: pendingAccounts ? Number(pendingAccounts.total_adeudado) || 0 : 0,
        },
        products: {
          totalProductos: products ? Number(products.total_productos) || 0 : 0,
          productosSinStock: products ? Number(products.sin_stock) || 0 : 0,
        },
      };
    } catch (error) {
      console.error("[Dashboard] Error:", error);
      return {
        sales: { transaccionesHoy: 0, totalVentasHoy: 0 },
        accounts: { cuentasPendientes: 0, totalAdeudado: 0 },
        products: { totalProductos: 0, productosSinStock: 0 },
      };
    } finally {
      connection.release();
    }
  }
}