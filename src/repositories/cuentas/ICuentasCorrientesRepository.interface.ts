/**
 * Interface for Cuentas Corriente Repository
 * Defines the contract for data access layer
 */
import { CuentaCorriente, VentaCuenta, Entrega, Movimiento } from '../../models/cuentas/types';
import { GetCuenta, GetCuentaWithCliente } from './models/GetCuenta';
import { GetVentaCuenta } from './models/GetVentaCuenta';
import { GetMovimiento } from './models/GetMovimiento';

// Filter options for listing cuentas
export interface GetCuentasFilter {
  estado?: 'ACTIVA' | 'SALDADA' | 'BLOQUEADA';
  clienteNombre?: string;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

// Filter for movements
export interface GetMovimientosFilter {
  tipo?: 'COMPRA' | 'ENTREGA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DESESTIMACION';
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

// Result types
export interface GetCuentasResponse {
  data: GetCuenta[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ICuentasCorrientesRepository {
  // Cuenta Corriente CRUD
  create(cuenta: Omit<CuentaCorriente, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getById(id: string): Promise<GetCuentaWithCliente | null>;
  getByClienteId(clienteId: string): Promise<GetCuenta | null>;
  getAll(filter: GetCuentasFilter): Promise<GetCuentasResponse>;
  update(id: string, cuenta: Partial<CuentaCorriente>): Promise<void>;
  delete(id: string): Promise<void>;

  // Ventas Cuenta
  createVentaCuenta(venta: Omit<VentaCuenta, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getVentasByCuentaId(cuentaId: string): Promise<GetVentaCuenta[]>;
  getVentaCuentaById(id: string): Promise<GetVentaCuenta | null>;
  updateVentaCuenta(id: string, data: { montoEntregado: number; montoPendiente: number; estado: string; fechaVenta?: Date }): Promise<void>;
  /** Actualiza createdat en la tabla sales para que la venta aparezca como venta del día en /ventas y /caja */
  updateSaleDate(saleId: string, date: Date): Promise<void>;

  // Entregas
  createEntrega(entrega: Omit<Entrega, 'id' | 'createdAt'>): Promise<string>;
  getEntregasByCuentaId(cuentaId: string, limit: number, offset: number): Promise<{ data: Entrega[]; total: number }>;

  // Movimientos
  createMovimiento(movimiento: Omit<Movimiento, 'id' | 'createdAt'>): Promise<string>;
  getMovimientosByCuentaId(cuentaId: string, filter: GetMovimientosFilter): Promise<{ data: GetMovimiento[]; total: number }>;
}