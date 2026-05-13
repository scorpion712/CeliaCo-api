import { Entrega, VentaCuenta } from '../../../models/cuentas/types';
import { GetVentaCuenta } from '../../../repositories/cuentas/models/GetVentaCuenta';

export interface SaldarTodoResponseDTO {
  entrega: {
    id: string;
    cuentaId: string;
    monto: number;
    metodoPago: string;
    descripcion?: string;
    createdAt: Date;
  };
  ventasPagadas: {
    id: string;
    ventaId: string;
    montoTotal: number;
    montoEntregado: number;
    montoPendiente: number;
    estado: string;
    fechaVenta: Date;
  }[];
  saldoAnterior: number;
  saldoNuevo: number;
}

export const adaptSaldarTodoResponse = (
  entrega: Entrega,
  ventasPagadas: GetVentaCuenta[]
): SaldarTodoResponseDTO => {
  return {
    entrega: {
      id: entrega.id,
      cuentaId: entrega.cuentaId,
      monto: entrega.monto,
      metodoPago: entrega.metodoPago,
      descripcion: entrega.descripcion,
      createdAt: entrega.createdAt,
    },
    ventasPagadas: ventasPagadas.map(v => ({
      id: v.id,
      ventaId: v.ventaId,
      montoTotal: v.montoTotal,
      montoEntregado: v.montoEntregado,
      montoPendiente: v.montoPendiente,
      estado: v.estado,
      fechaVenta: v.fechaVenta,
    })),
    saldoAnterior: entrega.monto,
    saldoNuevo: 0,
  };
};
