import { v4 as uuidv4 } from 'uuid';
import pool, { databaseType } from '../../../config/db';
import { CuentaCorriente, VentaCuenta, Entrega, Movimiento } from '../../../models/cuentas/types';
import { ICuentasCorrientesRepository, GetCuentasFilter, GetCuentasResponse, GetMovimientosFilter } from '../ICuentasCorrientesRepository.interface';
import { GetCuenta, GetCuentaWithCliente } from '../models/GetCuenta';
import { GetVentaCuenta } from '../models/GetVentaCuenta';
import { GetMovimiento } from '../models/GetMovimiento';

export class CuentasCorrientesRepository implements ICuentasCorrientesRepository {

  async create(cuenta: Omit<CuentaCorriente, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const connection = await pool.getConnection();
    const id = uuidv4();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          INSERT INTO cuentas_corrientes (id, clienteId, estado, total_comprado, total_entregado, saldo_actual, limiteCredito, createdAt, updatedAt)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
      } else {
        query = `
          INSERT INTO cuentas_corrientes (id, clienteId, estado, total_comprado, total_entregado, saldo_actual, limiteCredito, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      }

      const params = databaseType === 'postgresql'
        ? [id, cuenta.clienteId, cuenta.estado, cuenta.totalComprado, cuenta.totalEntregado, cuenta.saldoActual, cuenta.limiteCredito ?? null, new Date(), new Date()]
        : [id, cuenta.clienteId, cuenta.estado, cuenta.totalComprado, cuenta.totalEntregado, cuenta.saldoActual, cuenta.limiteCredito ?? null, new Date(), new Date()];

      await connection.query(query, params);
      return id;
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error(`Failed to create account: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

async getById(id: string): Promise<GetCuentaWithCliente | null> {
    const connection = await pool.getConnection();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          SELECT c.*, cl.name as "clienteNombre", cl.phone as "clienteTelefono"
          FROM cuentas_corrientes c
          LEFT JOIN customers cl ON c."clienteId" = cl.id
          WHERE c.id = $1 AND c."deletedAt" IS NULL
        `;
      } else {
        query = `
          SELECT c.*, cl.name as clienteNombre, cl.phone as clienteTelefono
          FROM cuentas_corrientes c
          LEFT JOIN customers cl ON c.clienteId = cl.id
          WHERE c.id = ? AND c.deletedAt IS NULL
        `;
      }

      const result = await connection.query(query, [id]);
      const rows = databaseType === 'postgresql' ? result[0] : result.rows;
      
      if (!rows || rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return this.mapRowToGetCuenta(row) as GetCuentaWithCliente;
    } catch (error) {
      console.error('Error getting account by id:', error);
      throw new Error(`Failed to get account: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async getByClienteId(clienteId: string): Promise<GetCuenta | null> {
    const connection = await pool.getConnection();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          SELECT c.*, cl.name as "clienteNombre", cl.phone as "clienteTelefono"
          FROM cuentas_corrientes c
          LEFT JOIN customers cl ON c.clienteId = cl.id
          WHERE c.clienteId = $1 AND c.deletedAt IS NULL
          ORDER BY c."createdAt" DESC
          LIMIT 1
        `;
      } else {
        query = `
          SELECT c.*, cl.name as clienteNombre, cl.phone as clienteTelefono
          FROM cuentas_corrientes c
          LEFT JOIN customers cl ON c.clienteId = cl.id
          WHERE c.clienteId = ? AND c.deletedAt IS NULL
          ORDER BY c.createdAt DESC
          LIMIT 1
        `;
      }

      const result = await connection.query(query, [clienteId]);
      const rows = databaseType === 'postgresql' ? result[0] : result.rows;
      
      if (!rows || rows.length === 0) {
        return null;
      }

      return this.mapRowToGetCuenta(rows[0]);
    } catch (error) {
      console.error('Error getting account by client id:', error);
      throw new Error(`Failed to get account by client: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

async getAll(filter: GetCuentasFilter): Promise<GetCuentasResponse> {
    const connection = await pool.getConnection();
    
    try {
      const isPg = databaseType === 'postgresql';
      
      // Simplified query without complex subqueries
      const dataQuery = isPg
        ? `SELECT 
              c.id, 
              c."clienteId", 
              c.estado, 
              c.total_comprado, 
              c.total_entregado, 
              c.saldo_actual, 
              c."limiteCredito", 
              c."createdAt", 
              c."updatedAt", 
              COALESCE(cl.name, '') as customer_name
            FROM cuentas_corrientes c 
            LEFT JOIN customers cl ON c."clienteId" = cl.id 
            WHERE c."deletedAt" IS NULL 
            ORDER BY c."createdAt" DESC 
            LIMIT $1 OFFSET $2`
        : `SELECT c.*, cl.name as customer_name, cl.phone as customerTelefono
            FROM cuentas_corrientes c 
            LEFT JOIN customers cl ON c.clienteId = cl.id 
            WHERE c.deletedAt IS NULL 
            ORDER BY c.createdAt DESC 
            LIMIT ? OFFSET ?`;
      
      const result = await connection.query(dataQuery, [filter.limit, filter.offset]);
      const rows = isPg ? result[0] : result.rows;
      
      const cuentas = rows.map((row: any) => ({
        id: row.id,
        clienteId: row.clienteId,
        clienteNombre: row.customer_name || row.clienteNombre || 'Sin nombre',
        clienteTelefono: row.clienteTelefono || row.phone || '',
        estado: row.estado,
        totalComprado: Number(row.total_comprado) || 0,
        totalEntregado: Number(row.total_entregado) || 0,
        saldoActual: Number(row.saldo_actual) || 0,
        limiteCredito: row.limiteCredito ? Number(row.limiteCredito) : undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        // Nuevos campos calculados - use createdAt as fallback
        ultimaCompra: row.createdAt,
        ultimoPago: row.updatedAt !== row.createdAt ? row.updatedAt : null,
      }));
      
      return {
        data: cuentas,
        pagination: {
          total: cuentas.length,
          page: Math.floor(filter.offset / filter.limit) + 1,
          pageSize: filter.limit,
          totalPages: Math.ceil(cuentas.length / filter.limit),
        },
      };
    } catch (error) {
      console.error('Error getting all accounts:', error);
      return {
        data: [],
        pagination: { total: 0, page: 1, pageSize: filter.limit, totalPages: 0 },
      };
    } finally {
      connection.release();
    }
  }

  async update(id: string, cuenta: Partial<CuentaCorriente>): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (cuenta.estado !== undefined) {
        updates.push(databaseType === 'postgresql' ? 'estado = $' + (params.length + 1) : 'estado = ?');
        params.push(cuenta.estado);
      }
      if (cuenta.totalComprado !== undefined) {
        updates.push(databaseType === 'postgresql' ? 'total_comprado = $' + (params.length + 1) : 'total_comprado = ?');
        params.push(cuenta.totalComprado);
      }
      if (cuenta.totalEntregado !== undefined) {
        updates.push(databaseType === 'postgresql' ? 'total_entregado = $' + (params.length + 1) : 'total_entregado = ?');
        params.push(cuenta.totalEntregado);
      }
      if (cuenta.saldoActual !== undefined) {
        updates.push(databaseType === 'postgresql' ? 'saldo_actual = $' + (params.length + 1) : 'saldo_actual = ?');
        params.push(cuenta.saldoActual);
      }
      if (cuenta.limiteCredito !== undefined) {
        updates.push(databaseType === 'postgresql' ? '"limiteCredito" = $' + (params.length + 1) : 'limiteCredito = ?');
        params.push(cuenta.limiteCredito);
      }

      updates.push(databaseType === 'postgresql' ? '"updatedAt" = $' + (params.length + 1) : 'updatedAt = ?');
      params.push(new Date());

      if (updates.length === 0) return;

      params.push(id);

      const query = databaseType === 'postgresql'
        ? `UPDATE cuentas_corrientes SET ${updates.join(', ')} WHERE id = $${params.length}`
        : `UPDATE cuentas_corrientes SET ${updates.join(', ')} WHERE id = ?`;

      await connection.query(query, params);
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error(`Failed to update account: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async delete(id: string): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      const query = databaseType === 'postgresql'
        ? `UPDATE cuentas_corrientes SET "deletedAt" = $1, "updatedAt" = $1 WHERE id = $2`
        : `UPDATE cuentas_corrientes SET deletedAt = ?, updatedAt = ? WHERE id = ?`;

      const now = new Date();
      await connection.query(query, [now, id]);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error(`Failed to delete account: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async createVentaCuenta(venta: Omit<VentaCuenta, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const connection = await pool.getConnection();
    const id = uuidv4();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          INSERT INTO ventas_cuenta (id, "cuentaId", "ventaId", monto_total, monto_entregado, monto_pendiente, estado, "fechaVenta", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
      } else {
        query = `
          INSERT INTO ventas_cuenta (id, cuentaId, ventaId, monto_total, monto_entregado, monto_pendiente, estado, fechaVenta, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      }

      const params = databaseType === 'postgresql'
        ? [id, venta.cuentaId, venta.ventaId, venta.montoTotal, venta.montoEntregado, venta.montoPendiente, venta.estado, venta.fechaVenta, new Date(), new Date()]
        : [id, venta.cuentaId, venta.ventaId, venta.montoTotal, venta.montoEntregado, venta.montoPendiente, venta.estado, venta.fechaVenta, new Date(), new Date()];

      await connection.query(query, params);
      return id;
    } catch (error) {
      console.error('[CuentasCorrientesRepository] createVentaCuenta - error:', error);
      throw new Error(`Failed to create credit sale: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async getVentasByCuentaId(cuentaId: string): Promise<GetVentaCuenta[]> {
    const connection = await pool.getConnection();
    
    try {
      const isPg = databaseType === 'postgresql';
      
      // First get the clienteId from the cuenta
      const cuentaQuery = isPg
        ? `SELECT "clienteId" FROM cuentas_corrientes WHERE id = $1`
        : `SELECT clienteId FROM cuentas_corrientes WHERE id = ?`;
      
      const cuentaResult = await connection.query(cuentaQuery, [cuentaId]);
      const cuentaRows = isPg ? cuentaResult[0] : cuentaResult.rows;
      
      if (!cuentaRows || cuentaRows.length === 0) {
        return [];
      }
      
      const clienteId = cuentaRows[0].clienteId;
      
        // Join sales with ventas_cuenta to get real vc id, amounts and estado
        const ventasQuery = isPg
          ? `
            SELECT
              vc.id           AS "vcId",
              s.id            AS "saleId",
              s.total         AS "ventaTotal",
              s.createdat     AS "ventaFecha",
              vc.monto_total     AS "montoTotal",
              vc.monto_entregado AS "montoEntregado",
              vc.monto_pendiente AS "montoPendiente",
              vc.estado,
              vc."fechaVenta",
              vc."createdAt",
              vc."updatedAt"
            FROM sales s
            JOIN ventas_cuenta vc ON vc."ventaId" = s.id
            WHERE s.customerid = $1
              AND s.type = 3
              AND s.deletedat IS NULL
              AND vc."cuentaId" = $2
            ORDER BY s.createdat ASC
          `
          : `
            SELECT
              vc.id           AS vcId,
              s.id            AS saleId,
              s.total         AS ventaTotal,
              s.createdAt     AS ventaFecha,
              vc.monto_total     AS montoTotal,
              vc.monto_entregado AS montoEntregado,
              vc.monto_pendiente AS montoPendiente,
              vc.estado,
              vc.fechaVenta,
              vc.createdAt,
              vc.updatedAt
            FROM sales s
            JOIN ventas_cuenta vc ON vc.ventaId = s.id
            WHERE s.customerid = ? AND s.type = 3 AND s.deletedAt IS NULL AND vc.cuentaId = ?
            ORDER BY s.createdAt ASC
          `;
        
        const result = await connection.query(ventasQuery, isPg ? [clienteId, cuentaId] : [clienteId, cuentaId]);
        const rows = isPg ? result[0] : result.rows;
        
        // For each venta, get the productos from saledetails AND entregas
        const ventas: GetVentaCuenta[] = await Promise.all(
          rows.map(async (row: any) => {
            const productos = await this.getSaleProductos(row.saleId);
            const { detallesEntrega, entregasPendientes } = await this.getEntregasForVenta(row.saleId, cuentaId);
            
            return {
              id: row.vcId,          // ← UUID de ventas_cuenta (para updateVentaCuenta)
              cuentaId: cuentaId,
              ventaId: row.saleId,   // ← ID en sales (para updateSaleDate)
              montoTotal: Number(row.montoTotal ?? row.ventaTotal),
              montoEntregado: Number(row.montoEntregado ?? 0),
              montoPendiente: Number(row.montoPendiente ?? row.ventaTotal),
              estado: (row.estado ?? 'PENDIENTE') as 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'DESESTIMADA',
              fechaVenta: row.fechaVenta ?? row.ventaFecha,
              createdAt: row.createdAt ?? row.ventaFecha,
              updatedAt: row.updatedAt ?? row.ventaFecha,
              ventaTotal: Number(row.ventaTotal),
              ventaFecha: row.ventaFecha,
              productos,
              detallesEntrega,
              entregasPendientes,
            };
          })
        );
      
      return ventas;
    } catch (error) {
      console.error('Error getting credit sales:', error);
      throw new Error(`Failed to get credit sales: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }
  
  // Helper to get productos de una venta
  private async getSaleProductos(saleId: string): Promise<{ id: string; productId: string; productName: string; cantidad: number; precio: number; total: number }[]> {
    const connection = await pool.getConnection();
    const isPg = databaseType === 'postgresql';
    
    try {
      const query = isPg
        ? `
          SELECT sd.id, sd.product as "productId", COALESCE(p.name, 'Producto ' || sd.product) as "productName", sd.amount as cantidad, sd.total / sd.amount as precio, sd.total
          FROM saledetails sd
          LEFT JOIN products p ON sd.product = p.id
          WHERE sd.saleid = $1
        `
        : `
          SELECT sd.id, sd.product as productId, COALESCE(p.name, CONCAT('Producto ', sd.product)) as productName, sd.amount as cantidad, sd.total / sd.amount as precio, sd.total
          FROM saledetails sd
          LEFT JOIN products p ON sd.product = p.id
          WHERE sd.saleid = ?
        `;
      
      const result = await connection.query(query, [saleId]);
      const rows = isPg ? result[0] : result.rows;
      
      return rows.map((row: any) => ({
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        cantidad: Number(row.cantidad),
        precio: Number(row.precio),
        total: Number(row.total),
      }));
    } catch (error) {
      console.error('Error getting sale productos:', error);
      return [];
    } finally {
      connection.release();
    }
  }

  // NEW: Helper to get entregas (deliveries) for a specific sale/venta
  private async getEntregasForVenta(
    ventaId: string,
    cuentaId: string
  ): Promise<{
    detallesEntrega: Array<{ entregaId: string; fecha: string; cantidad: number; numeroRemito: string; status: string }>;
    entregasPendientes: Array<{ id: string; cantidadEsperada: number; cantidadEntregada: number; numeroRemito: string; status: string }>;
  }> {
    const connection = await pool.getConnection();
    const isPg = databaseType === 'postgresql';
    
    try {
      // Query to get all entregas for this venta
      // Note: We're looking for entregas in the entregas_cuenta table that are related to this venta
      // The detalleAplicacion field contains JSON with ventaId references
      const query = isPg
        ? `
          SELECT 
            ec.id as "entregaId",
            ec."createdAt" as fecha,
            COALESCE(ec.monto, 0) as cantidad,
            COALESCE(ec.descripcion, 'Entrega') as "numeroRemito",
            COALESCE(ec.estado, 'PENDIENTE') as status
          FROM entregas_cuenta ec
          WHERE ec."cuentaId" = $1
          ORDER BY ec."createdAt" DESC
        `
        : `
          SELECT 
            ec.id as entregaId,
            ec.createdAt as fecha,
            COALESCE(ec.monto, 0) as cantidad,
            COALESCE(ec.descripcion, 'Entrega') as numeroRemito,
            COALESCE(ec.estado, 'PENDIENTE') as status
          FROM entregas_cuenta ec
          WHERE ec.cuentaId = ?
          ORDER BY ec.createdAt DESC
        `;
      
      const result = await connection.query(query, [cuentaId]);
      const entregas = isPg ? result[0] : result.rows;
      
      // Map to detalles entrega (all completed/applied deliveries)
      const detallesEntrega = entregas
        .filter((e: any) => e.status === 'COMPLETA' || e.status === 'PARCIAL')
        .map((e: any) => ({
          entregaId: e.entregaId,
          fecha: e.fecha instanceof Date ? e.fecha.toISOString().split('T')[0] : e.fecha,
          cantidad: Number(e.cantidad),
          numeroRemito: e.numeroRemito || `REM-${e.entregaId}`,
          status: e.status,
        }));
      
      // Map to entregas pendientes (incomplete deliveries)
      const entregasPendientes = entregas
        .filter((e: any) => e.status === 'PENDIENTE')
        .map((e: any) => ({
          id: e.entregaId,
          cantidadEsperada: Number(e.cantidad),
          cantidadEntregada: 0, // Assuming 0 for pending
          numeroRemito: e.numeroRemito || `REM-${e.entregaId}`,
          status: e.status,
        }));
      
      return { detallesEntrega, entregasPendientes };
    } catch (error) {
      console.error('Error getting entregas for venta:', error);
      // Return empty arrays if there's an error
      return { detallesEntrega: [], entregasPendientes: [] };
    } finally {
      connection.release();
    }
  }

  async getVentaCuentaById(id: string): Promise<GetVentaCuenta | null> {
    const connection = await pool.getConnection();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `SELECT * FROM ventas_cuenta WHERE id = $1`;
      } else {
        query = `SELECT * FROM ventas_cuenta WHERE id = ?`;
      }

      const result = await connection.query(query, [id]);
      const rows = databaseType === 'postgresql' ? result[0] : result.rows;
      
      if (!rows || rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        cuentaId: row.cuentaId,
        ventaId: row.ventaId,
        montoTotal: Number(row.monto_total),
        montoEntregado: Number(row.monto_entregado),
        montoPendiente: Number(row.monto_pendiente),
        estado: row.estado,
        fechaVenta: row.fechaVenta,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (error) {
      console.error('Error getting credit sale by id:', error);
      throw new Error(`Failed to get credit sale: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async updateVentaCuenta(id: string, data: { montoEntregado: number; montoPendiente: number; estado: string; fechaVenta?: Date }): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      const isPg = databaseType === 'postgresql';
      
      // Build update query dynamically
      const updates: string[] = [
        isPg ? 'monto_entregado = $1' : 'monto_entregado = ?',
        isPg ? 'monto_pendiente = $2' : 'monto_pendiente = ?',
        isPg ? 'estado = $3' : 'estado = ?',
        isPg ? '"updatedAt" = $4' : 'updatedAt = ?',
      ];
      const params: any[] = [
        data.montoEntregado,
        data.montoPendiente,
        data.estado,
        new Date(),
      ];

      // Add fechaVenta update if provided (for marking sale as paid on payment date)
      if (data.fechaVenta) {
        updates.push(isPg ? '"fechaVenta" = $' + (params.length + 1) : 'fechaVenta = ?');
        params.push(data.fechaVenta);
      }

      params.push(id);

      const query = isPg
        ? `UPDATE ventas_cuenta SET ${updates.join(', ')} WHERE id = $${params.length}`
        : `UPDATE ventas_cuenta SET ${updates.join(', ')} WHERE id = ?`;

      await connection.query(query, params);
    } catch (error) {
      console.error('[CuentasCorrientesRepository] updateVentaCuenta - error:', error);
      throw new Error(`Failed to update credit sale: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async updateSaleDate(saleId: string, date: Date): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const isPg = databaseType === 'postgresql';
      const query = isPg
        ? `UPDATE sales SET createdat = $1, updatedat = $1 WHERE id = $2`
        : `UPDATE sales SET createdAt = ?, updatedAt = ? WHERE id = ?`;
      const params = isPg ? [date, saleId] : [date, date, saleId];
      await connection.query(query, params);
    } catch (error) {
      console.error('[CuentasCorrientesRepository] updateSaleDate - error:', error);
      throw new Error(`Failed to update sale date: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async createEntrega(entrega: Omit<Entrega, 'id' | 'createdAt'>): Promise<string> {
    const connection = await pool.getConnection();
    const id = uuidv4();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          INSERT INTO entregas_cuenta (id, "cuentaId", monto, "metodoPago", descripcion, "detalleAplicacion", "createdAt", "createdBy")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
      } else {
        query = `
          INSERT INTO entregas_cuenta (id, cuentaId, monto, metodoPago, descripcion, detalleAplicacion, createdAt, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
      }

      const detalleJson = JSON.stringify(entrega.detalleAplicacion);

      const params = databaseType === 'postgresql'
        ? [id, entrega.cuentaId, entrega.monto, entrega.metodoPago, entrega.descripcion ?? null, detalleJson, new Date(), entrega.createdBy ?? null]
        : [id, entrega.cuentaId, entrega.monto, entrega.metodoPago, entrega.descripcion ?? null, detalleJson, new Date(), entrega.createdBy ?? null];

      await connection.query(query, params);
      return id;
    } catch (error) {
      console.error('[CuentasCorrientesRepository] createEntrega - error:', error);
      throw new Error(`Failed to create payment: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async getEntregasByCuentaId(cuentaId: string, limit: number, offset: number): Promise<{ data: Entrega[]; total: number }> {
    const connection = await pool.getConnection();
    const isPg = databaseType === 'postgresql';
    
    try {
      const countQuery = isPg
        ? `SELECT COUNT(*) as total FROM entregas_cuenta WHERE "cuentaId" = $1`
        : `SELECT COUNT(*) as total FROM entregas_cuenta WHERE cuentaId = ?`;
      
      // Use fixed parameter indices for LIMIT/OFFSET
      const dataQuery = isPg
        ? `SELECT * FROM entregas_cuenta WHERE "cuentaId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`
        : `SELECT * FROM entregas_cuenta WHERE cuentaId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, [cuentaId]),
        connection.query(dataQuery, isPg ? [cuentaId, limit, offset] : [cuentaId, limit, offset]),
      ]);

      const total = isPg
        ? countResult[0][0]?.total
        : countResult.rows[0]?.total;

      const rows = isPg ? dataResult[0] : dataResult.rows;

      const data = rows.map((row: any) => ({
        id: row.id,
        cuentaId: row.cuentaId,
        monto: Number(row.monto),
        metodoPago: row.metodoPago,
        descripcion: row.descripcion,
        detalleAplicacion: row.detalleAplicacion ? (typeof row.detalleAplicacion === 'string' ? JSON.parse(row.detalleAplicacion) : row.detalleAplicacion) : [],
        createdAt: row.createdAt,
        createdBy: row.createdBy,
      }));

      return { data, total };
    } catch (error) {
      console.error('Error getting payments:', error);
      throw new Error(`Failed to get payments: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async createMovimiento(movimiento: Omit<Movimiento, 'id' | 'createdAt'>): Promise<string> {
    const connection = await pool.getConnection();
    const id = uuidv4();
    
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          INSERT INTO movimientos_cuenta (id, "cuentaId", tipo, "referenciaId", "referenciaTipo", monto, "saldoAnterior", "saldoNuevo", descripcion, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
      } else {
        query = `
          INSERT INTO movimientos_cuenta (id, cuentaId, tipo, referenciaId, referenciaTipo, monto, saldoAnterior, saldoNuevo, descripcion, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      }

      const params = databaseType === 'postgresql'
        ? [id, movimiento.cuentaId, movimiento.tipo, movimiento.referenciaId ?? null, movimiento.referenciaTipo ?? null, movimiento.monto, movimiento.saldoAnterior, movimiento.saldoNuevo, movimiento.descripcion ?? null, new Date()]
        : [id, movimiento.cuentaId, movimiento.tipo, movimiento.referenciaId ?? null, movimiento.referenciaTipo ?? null, movimiento.monto, movimiento.saldoAnterior, movimiento.saldoNuevo, movimiento.descripcion ?? null, new Date()];

      await connection.query(query, params);
      return id;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw new Error(`Failed to create movement: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  async getMovimientosByCuentaId(cuentaId: string, filter: GetMovimientosFilter): Promise<{ data: GetMovimiento[]; total: number }> {
    const connection = await pool.getConnection();
    
    try {
      const isPg = databaseType === 'postgresql';
      let params: any[] = [cuentaId];
      
      // Build WHERE clause dynamically
      let whereClause = isPg ? 'WHERE "cuentaId" = $1' : 'WHERE cuentaId = ?';
      
      if (filter.tipo) {
        const paramNum = params.length + 1;
        whereClause += isPg ? ` AND tipo = $${paramNum}` : ' AND tipo = ?';
        params.push(filter.tipo);
      }
      
      if (filter.startDate) {
        const paramNum = params.length + 1;
        whereClause += isPg ? ` AND "createdAt" >= $${paramNum}` : ' AND createdAt >= ?';
        params.push(filter.startDate.toISOString());
      }
      
      if (filter.endDate) {
        const paramNum = params.length + 1;
        whereClause += isPg ? ` AND "createdAt" <= $${paramNum}` : ' AND createdAt <= ?';
        params.push(filter.endDate.toISOString());
      }
      
      const countQuery = isPg
        ? `SELECT COUNT(*) as total FROM movimientos_cuenta ${whereClause}`
        : `SELECT COUNT(*) as total FROM movimientos_cuenta ${whereClause}`;
      
      const limitParamNum = params.length + 1;
      const offsetParamNum = params.length + 2;
      
      const dataQuery = isPg
        ? `SELECT * FROM movimientos_cuenta ${whereClause} ORDER BY "createdAt" DESC LIMIT $${limitParamNum} OFFSET $${offsetParamNum}`
        : `SELECT * FROM movimientos_cuenta ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      
      const dataParams = [...params, filter.limit, filter.offset];
      
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, params),
        connection.query(dataQuery, isPg ? dataParams : dataParams),
      ]);

      const total = isPg
        ? countResult[0][0]?.total
        : countResult.rows[0]?.total;

      const rows = isPg ? dataResult[0] : dataResult.rows;

      const data = rows.map((row: any) => ({
        id: row.id,
        cuentaId: row.cuentaId,
        tipo: row.tipo,
        referenciaId: row.referenciaId,
        referenciaTipo: row.referenciaTipo,
        monto: Number(row.monto),
        saldoAnterior: Number(row.saldoAnterior),
        saldoNuevo: Number(row.saldoNuevo),
        descripcion: row.descripcion,
        createdAt: row.createdAt,
      }));

      return { data, total };
    } catch (error) {
      console.error('Error getting movements:', error);
      throw new Error(`Failed to get movements: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  private mapRowToGetCuenta(row: any): GetCuenta {    
    const clienteNombre = row.clienteNombre || row.name || '';
    return {
      id: row.id,
      clienteId: row.clienteId,
      estado: row.estado,
      totalComprado: Number(row.total_comprado),
      totalEntregado: Number(row.total_entregado),
      saldoActual: Number(row.saldo_actual),
      limiteCredito: row.limiteCredito ? Number(row.limiteCredito) : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      clienteNombre: clienteNombre,
      clienteTelefono: row.clienteTelefono || row.phone || '',
      clienteEmail: row.clienteEmail ?? "",
    };
  }
}
