import pool from "../../config/db";
import { CashBox } from "../../models/cashbox/CashBox";

export interface ICashBoxRepository {
  getOrCreateTodayBox(): Promise<CashBox>;
  closeBox(id: string, cierre: number): Promise<void>;
}

export class CashBoxRepository implements ICashBoxRepository {
  async getOrCreateTodayBox(): Promise<CashBox> {
    const connection = await pool.getConnection();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Try to find today's box
      const query = `
        SELECT id, fecha, COALESCE(apertura, 0) as apertura, cierre, cerrada, createdat, updatedat
        FROM cashbox 
        WHERE fecha = $1
      `;
      
      const result = await connection.query(query, [today]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          fecha: row.fecha,
          apertura: row.apertura,
          cierre: row.cierre,
          cerrada: row.cerrada,
          createdAt: row.createdat,
          updatedAt: row.updatedat,
        };
      }
      
      // Create new box for today
      const insertQuery = `
        INSERT INTO cashbox (id, fecha, apertura, cerrada, createdat, updatedat)
        VALUES ($1, $2, 0, false, NOW(), NOW())
        RETURNING id, fecha, apertura, cierre, cerrada, createdat, updatedat
      `;
      
      const { v4: uuidv4 } = await import("uuid");
      const newBoxResult = await connection.query(insertQuery, [uuidv4(), today]);
      const row = newBoxResult.rows[0];
      
      return {
        id: row.id,
        fecha: row.fecha,
        apertura: row.apertura,
        cierre: row.cierre,
        cerrada: row.cerrada,
        createdAt: row.createdat,
        updatedAt: row.updatedat,
      };
    } finally {
      connection.release();
    }
  }

  async closeBox(id: string, cierre: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      const query = `
        UPDATE cashbox 
        SET cierre = $1, cerrada = true, updatedat = NOW()
        WHERE id = $2
      `;
      
      await connection.query(query, [cierre, id]);
    } finally {
      connection.release();
    }
  }
}