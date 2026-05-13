import { GetCuentaWithCliente } from '../../../repositories/cuentas/models/GetCuenta';
import { GetVentaCuenta } from '../../../repositories/cuentas/models/GetVentaCuenta';
import { GetMovimiento } from '../../../repositories/cuentas/models/GetMovimiento';
import { Entrega } from '../../../models/cuentas/types';

export interface GetCuentaByIdResponseDTO {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string;
  estado: 'ACTIVA' | 'SALDADA' | 'BLOQUEADA';
  totalComprado: number;
  totalEntregado: number;
  saldoActual: number;
  limiteCredito?: number;
  alertas: string[];
  ventasPendientes: {
    id: string;
    ventaId: string;
    montoTotal: number;
    montoEntregado: number;
    montoPendiente: number;
    estado: string;
    fechaVenta: Date;
    productos: {
      id: string;
      productId: string;
      productName: string;
      cantidad: number;
      precio: number;
      total: number;
    }[];
    // NEW: Delivery application details
    detallesEntrega: {
      entregaId: string;
      fecha: string;
      cantidad: number;
      numeroRemito: string;
      status: string;
    }[];
    // NEW: Pending deliveries for this sale
    entregasPendientes: {
      id: string;
      cantidadEsperada: number;
      cantidadEntregada: number;
      numeroRemito: string;
      status: string;
    }[];
  }[];
  entregas: {
    id: string;
    cuentaId: string;
    monto: number;
    metodoPago: string;
    descripcion?: string;
    createdAt: Date;
  }[];
  movimientos: {
    id: string;
    cuentaId: string;
    tipo: string;
    monto: number;
    saldoAnterior: number;
    saldoNuevo: number;
    descripcion?: string;
    createdAt: Date;
  }[];
  ultimaEntrega?: {
    fecha: Date;
    monto: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const adaptGetCuentaByIdResponse = (
  cuenta: GetCuentaWithCliente,
  ventas: GetVentaCuenta[],
  entregas: Entrega[],
  movimientos: GetMovimiento[],
  ultimaEntrega?: { fecha: Date; monto: number }
): GetCuentaByIdResponseDTO => {
  const alertas: string[] = [];
  
  if (cuenta.limiteCredito) {
    if (cuenta.saldoActual > cuenta.limiteCredito * 0.8) {
      alertas.push('ACERCANDO_LIMITE');
    }
    if (cuenta.saldoActual > cuenta.limiteCredito) {
      alertas.push('EXCEDE_LIMITE');
    }
  }

  const ventasPendientes = ventas
    .filter(v => v.estado !== 'PAGADA' && v.estado !== 'DESESTIMADA')
    .map(v => ({
      id: v.id,
      ventaId: v.ventaId,
      montoTotal: v.montoTotal,
      montoEntregado: v.montoEntregado,
      montoPendiente: v.montoPendiente,
      estado: v.estado,
      fechaVenta: v.fechaVenta,
      productos: v.productos || [],
      // NEW: Delivery application details
      detallesEntrega: v.detallesEntrega || [],
      // NEW: Pending deliveries for this sale
      entregasPendientes: v.entregasPendientes || [],
    }));

  const entregas_data = entregas.slice(0, 10).map(e => ({
    id: e.id,
    cuentaId: e.cuentaId,
    monto: e.monto,
    metodoPago: e.metodoPago,
    descripcion: e.descripcion,
    createdAt: e.createdAt,
  }));

  const movimientos_data = movimientos.slice(0, 20).map(m => ({
    id: m.id,
    cuentaId: m.cuentaId,
    tipo: m.tipo,
    monto: m.monto,
    saldoAnterior: m.saldoAnterior,
    saldoNuevo: m.saldoNuevo,
    descripcion: m.descripcion,
    createdAt: m.createdAt,
  }));

  return {
    id: cuenta.id,
    clienteId: cuenta.clienteId,
    clienteNombre: cuenta.cliente?.nombre || cuenta.clienteNombre || '',
    clienteTelefono: cuenta.cliente?.telefono || cuenta.clienteTelefono,
    estado: cuenta.estado,
    totalComprado: cuenta.totalComprado,
    totalEntregado: cuenta.totalEntregado,
    saldoActual: cuenta.saldoActual,
    limiteCredito: cuenta.limiteCredito,
    alertas,
    ventasPendientes,
    entregas: entregas_data,
    movimientos: movimientos_data,
    ultimaEntrega,
    createdAt: cuenta.createdAt,
    updatedAt: cuenta.updatedAt,
  };
};
