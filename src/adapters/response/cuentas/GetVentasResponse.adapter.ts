import { GetVentaCuenta } from '../../../repositories/cuentas/models/GetVentaCuenta';

export interface GetVentasResponseDTO {
  data: {
    id: string;
    cuentaId: string;
    ventaId: string;
    montoTotal: number;
    montoEntregado: number;
    montoPendiente: number;
    estado: string;
    fechaVenta: Date;
  }[];
}

export const adaptGetVentasResponse = (ventas: GetVentaCuenta[]): GetVentasResponseDTO => {
  return {
    data: ventas.map(v => ({
      id: v.id,
      cuentaId: v.cuentaId,
      ventaId: v.ventaId,
      montoTotal: v.montoTotal,
      montoEntregado: v.montoEntregado,
      montoPendiente: v.montoPendiente,
      estado: v.estado,
      fechaVenta: v.fechaVenta,
    })),
  };
};
