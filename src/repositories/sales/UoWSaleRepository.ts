import { IUnitOfWork, IConnection } from '../../database';

export class SaleRepository {
  constructor(private uow: IUnitOfWork) {}

  async create(data: {
    type: string;
    clienteId: string;
    total: number;
    estado: string;
  }): Promise<number> {
    const result = await this.uow.query(
      `INSERT INTO sales (type, cliente_id, total, estado, fecha) VALUES (?, ?, ?, ?, NOW())`,
      [data.type, data.clienteId, data.total, data.estado]
    );
    return result.insertId;
  }

  async createDetails(saleId: number, items: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>): Promise<void> {
    for (const item of items) {
      await this.uow.query(
        `INSERT INTO sale_details (sale_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.productId, item.quantity, item.price, item.subtotal]
      );
    }
  }

  async updateStock(productId: string, quantity: number, operation: 'add' | 'subtract'): Promise<void> {
    const operator = operation === 'add' ? '+' : '-';
    await this.uow.query(
      `UPDATE products SET stock = stock ${operator} ? WHERE id = ?`,
      [quantity, productId]
    );
  }

  async setStatus(saleId: number, estado: string): Promise<void> {
    await this.uow.query(
      `UPDATE sales SET estado = ?, updated_at = NOW() WHERE id = ?`,
      [estado, saleId]
    );
  }
}

export class AccountRepository {
  constructor(private uow: IUnitOfWork) {}

  async create(data: {
    clienteId: string;
    saleId: number;
    montoTotal: number;
    montoPendiente: number;
  }): Promise<void> {
    await this.uow.query(
      `INSERT INTO cuentas_corrientes (cliente_id, sale_id, monto_total, monto_pendiente, estado, created_at) VALUES (?, ?, ?, ?, 'activa', NOW())`,
      [data.clienteId, data.saleId, data.montoTotal, data.montoPendiente]
    );
  }

  async updateBalance(cuentaId: number, montoPendiente: number): Promise<void> {
    await this.uow.query(
      `UPDATE cuentas_corrientes SET monto_pendiente = ?, updated_at = NOW() WHERE id = ?`,
      [montoPendiente, cuentaId]
    );
  }
}