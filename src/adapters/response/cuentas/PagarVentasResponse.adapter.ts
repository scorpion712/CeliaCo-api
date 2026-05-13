import { Entrega } from '../../../models/cuentas/types';
import { GetVentaCuenta } from '../../../repositories/cuentas/models/GetVentaCuenta';

export interface PagarVentasResponseDTO {
  entrega: {
    id: string;
    cuentaId: string;
    monto: number;
    metodoPago: string;
    descripcion?: string;
    createdAt: Date;
  };
  ventasActualizadas: {
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

export const adaptPagarVentasResponse = (
  entrega: Entrega,
  ventasActualizadas: GetVentaCuenta[]
): PagarVentasResponseDTO => {
  return {
    entrega: {
      id: entrega.id,
      cuentaId: entrega.cuentaId,
      monto: entrega.monto,
      metodoPago: entrega.metodoPago,
      descripcion: entrega.descripcion,
      createdAt: entrega.createdAt,
    },
    ventasActualizadas: ventasActualizadas.map(v => ({
      id: v.id,
      ventaId: v.ventaId,
      montoTotal: v.montoTotal,
      montoEntregado: v.montoEntregado,
      montoPendiente: v.montoPendiente,
      estado: v.estado,
      fechaVenta: v.fechaVenta,
    })),
    // These will be calculated by the handler before calling this adapter
    saldoAnterior: 0,
    saldoNuevo: 0,
  };
};
