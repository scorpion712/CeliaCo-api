import { v4 as uuidv4 } from "uuid";

import pool, { databaseType } from "../../../config/db";
import { ICustomersRepository } from "../ICustomersRepository";
import { Customer } from "../models/Customer";
import createHttpError from "http-errors";
import {
  GetCustomersRequest,
  GetCustomersResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
} from "../../../models";
import { adaptGetCustomersResponse } from "../../../adapters";

export class CustomersRepository implements ICustomersRepository {
  async createCustomer(customer: Customer): Promise<string> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const id = uuidv4();
      let query: string;

      if (databaseType === 'postgresql') {
        query = `
          INSERT INTO customers (id, name, phone, fiscalId, idNumber, ivaCategory, createdAt)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
      } else {
        query = `
          INSERT INTO customers (id, name, phone, fiscalId, idNumber, ivaCategory, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
      }

      const params = databaseType === 'postgresql'
        ? [id, customer.name, customer.phone, customer.fiscalId, customer.idNumber, customer.ivaCategory, new Date()]
        : [id, customer.name, customer.phone, customer.fiscalId, customer.idNumber, customer.ivaCategory, new Date()];

      await connection.query(query, params);

      await connection.commit();

      return id;
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar crear el cliente`
      );
    } finally {
      connection.release();
    }
  }

  async getCustomerByDNI(customerIdNumber: string): Promise<Customer | null> {
    const connection = await pool.getConnection();
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `SELECT * FROM customers WHERE idNumber = $1`;
      } else {
        query = `SELECT * FROM customers WHERE idNumber = ?`;
      }

      const result = await connection.query(query, [customerIdNumber]);

      const data = databaseType === 'postgresql' ? result[0] : result.rows;

      if (!data || !data[0]) return null;

      return {
        id: data[0].id,
        name: data[0].name,
        phone: data[0].phone,
        fiscalId: data[0].fiscalId,
        idNumber: data[0].idNumber,
        ivaCategory: data[0].ivacategory,
        createdAt: data[0].createdat,
        disabled: data[0].deletedat ? false : true,
      } as Customer;
    } catch (error) {
      console.error(`Database error: ${(error as Error).message}`);

      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar obtener el cliente por su DNI`
      );
    } finally {
      connection.release();
    }
  }

  async getCustomerByFiscalId(
    customerFiscalIdNumber: string
  ): Promise<Customer | null> {
    const connection = await pool.getConnection();
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `SELECT * FROM customers WHERE fiscalId = $1`;
      } else {
        query = `SELECT * FROM customers WHERE fiscalId = ?`;
      }

      const result = await connection.query(query, [customerFiscalIdNumber]);

      const data = databaseType === 'postgresql' ? result[0] : result.rows;

      if (!data || !data[0]) return null;

      return {
        id: data[0].id,
        name: data[0].name,
        phone: data[0].phone,
        fiscalId: data[0].fiscalId,
        idNumber: data[0].idNumber,
        ivaCategory: data[0].ivacategory,
        createdAt: data[0].createdat,
        disabled: data[0].deletedat ? false : true,
      } as Customer;
    } catch (error) {
      console.error(`Database error: ${(error as Error).message}`);

      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar obtener el cliente por su CUIT`
      );
    } finally {
      connection.release();
    }
  }

  async getCustomerByName(name: string): Promise<Customer | null> {
    const connection = await pool.getConnection();
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `SELECT * FROM customers WHERE LOWER(name) = LOWER($1) AND deletedAt IS NULL`;
      } else {
        query = `SELECT * FROM customers WHERE LOWER(name) = LOWER(?) AND deletedAt IS NULL`;
      }

      const result = await connection.query(query, [name]);

      const data = databaseType === 'postgresql' ? result[0] : result.rows;

      if (!data || !data[0]) return null;

      return {
        id: data[0].id,
        name: data[0].name,
        phone: data[0].phone,
        fiscalId: data[0].fiscalId,
        idNumber: data[0].idNumber,
        ivaCategory: data[0].ivacategory,
        createdAt: data[0].createdat,
        disabled: data[0].deletedat ? false : true,
      } as Customer;
    } catch (error) {
      console.error(`Database error: ${(error as Error).message}`);

      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar obtener el cliente por su nombre`
      );
    } finally {
      connection.release();
    }
  }

  async getCustomer(customerId: string): Promise<Customer> { 
    const connection = await pool.getConnection();
    try {
      let query: string;
      if (databaseType === 'postgresql') {
        query = `SELECT * FROM customers WHERE id = $1`;
      } else {
        query = `SELECT * FROM customers WHERE id = ?`;
      }

      const result = await connection.query(query, [customerId]);

      const data = databaseType === 'postgresql' ? result[0] : result.rows;

      return {
        id: data[0].id,
        name: data[0].name,
        phone: data[0].phone,
        fiscalId: data[0].fiscalId,
        idNumber: data[0].idNumber,
        ivaCategory: data[0].ivacategory,
        createdAt: data[0].createdat,
        disabled: data[0].deletedat ? false : true,
      } as Customer;
    } catch (error) {
      console.error(`Database error: ${(error as Error).message}`);

      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar obtener el cliente`
      );
    } finally {
      connection.release();
    }
  }

  async getCustomers(
    filter: GetCustomersRequest
  ): Promise<GetCustomersResponse> {
    const connection = await pool.getConnection();
    try {
      const params: any[] = [];

      let fullWhereClause = `FROM customers c `;

      switch (filter.tab) {
        case "actives":
          fullWhereClause += "WHERE deletedAt IS NULL";
          break;
        case "deleted":
          fullWhereClause += "WHERE deletedAt IS NOT NULL";
          break;
        default:
          break;
      }

      if (filter.search && filter.search.trim().length > 0) {
        if (databaseType === 'postgresql') {
          fullWhereClause += ` AND (LOWER(c.name) LIKE LOWER('%' || $${params.length + 1} || '%') 
          OR c.phone LIKE '%' || $${params.length + 1} || '%' 
          OR c.fiscalId LIKE '%' || $${params.length + 1} || '%'  
          OR c.idNumber LIKE '%' || $${params.length + 1} || '%') 
          `;
        } else {
          fullWhereClause += ` AND (LOWER(c.name) LIKE LOWER(CONCAT('%', '${filter.search}', '%')) 
          OR c.phone LIKE CONCAT('%', '${filter.search}', '%') 
          OR c.fiscalId LIKE CONCAT('%', '${filter.search}', '%')  
          OR c.idNumber LIKE CONCAT('%', '${filter.search}', '%')) 
          `;
        }
        params.push(filter.search);
      }

      let countQuery: string;
      let dataQuery: string;

      if (databaseType === 'postgresql') {
        countQuery = `SELECT COUNT(*) as total ${fullWhereClause}`;
        dataQuery = `
          SELECT c.* ${fullWhereClause}
          ORDER BY c.createdAt DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
      } else {
        countQuery = `SELECT COUNT(*) as total ${fullWhereClause}`;
        dataQuery = `
          SELECT c.* ${fullWhereClause}
          ORDER BY c.createdAt DESC
          LIMIT ? OFFSET ?
        `;
      }

      params.push(filter.limit, filter.offset);

      const countParams = databaseType === 'postgresql'
        ? params.slice(0, -2)
        : [];

      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, countParams),
        connection.query(dataQuery, params),
      ]);

      const total = databaseType === 'postgresql'
        ? countResult[0][0]?.total
        : countResult.rows[0]?.total;

      const data = databaseType === 'postgresql'
        ? dataResult[0]
        : dataResult.rows;

      return {
        data: adaptGetCustomersResponse(data),
        pagination: {
          total,
          page: Math.floor(filter.offset / filter.limit) + 1,
          pageSize: filter.limit,
          totalPages: Math.ceil(total / filter.limit),
        },
      } as GetCustomersResponse;
    } catch (error) {
      console.error(`Database error: ${(error as Error).message}`);

      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar obtener los clientes`
      );
    } finally {
      connection.release();
    }
  }

  async updateCustomer(
    customer: UpdateCustomerRequest
  ): Promise<UpdateCustomerResponse> {
    const { id, name, phone, fiscalId, idNumber, ivaCategory } = customer;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          UPDATE customers  
          SET name = $1, phone = $2, fiscalId = $3, idNumber = $4, ivaCategory = $5
          WHERE id = $6
        `;
      } else {
        query = `
          UPDATE customers  
          SET name = ?, phone = ?, fiscalId = ?, idNumber = ?, ivaCategory = ?
          WHERE id = ?
        `;
      }

      const params = databaseType === 'postgresql'
        ? [name, phone, fiscalId, idNumber, ivaCategory, id]
        : [name, phone, fiscalId, idNumber, ivaCategory, id];

      const res = await connection.query(query, params);

      const affectedRows = databaseType === 'postgresql'
        ? res.rowCount
        : res[0].affectedRows;

      if (affectedRows == 0)
        throw createHttpError(404, `No se encontró el cliente`);

      await connection.commit();

      return { id: customer.id } as UpdateCustomerResponse;
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

  async deleteCustomer(customerId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          UPDATE customers  
          SET deletedAt = NOW()
          WHERE id = $1
        `;
      } else {
        query = `
          UPDATE customers  
          SET deletedAt = NOW()
          WHERE id = ?
        `;
      }

      const res = await connection.query(query, [customerId]);

      const affectedRows = databaseType === 'postgresql'
        ? res.rowCount
        : res[0].affectedRows;

      if (affectedRows == 0)
        throw createHttpError(404, `No se encontró el cliente a eliminar`);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar eliminar el cliente`
      );
    } finally {
      connection.release();
    }
  }

  async activateCustomer(customerId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let query: string;
      if (databaseType === 'postgresql') {
        query = `
          UPDATE customers  
          SET deletedAt = NULL
          WHERE id = $1
        `;
      } else {
        query = `
          UPDATE customers  
          SET deletedAt = NULL
          WHERE id = ?
        `;
      }

      const res = await connection.query(query, [customerId]);

      const affectedRows = databaseType === 'postgresql'
        ? res.rowCount
        : res[0].affectedRows;

      if (affectedRows == 0)
        throw createHttpError(404, `No se encontró el cliente para activar`);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error(error);
      throw createHttpError(
        400,
        `Ha ocurrido un error al intentar activar el cliente`
      );
    } finally {
      connection.release();
    }
  }
}
