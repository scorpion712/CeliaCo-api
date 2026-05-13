import { GetVentaCuenta } from '../../../repositories/cuentas/models/GetVentaCuenta';

export interface PagarVentaErrorResponse {
  success: false;
  error: 'ENTREGAS_INCOMPLETAS' | 'VENTA_NO_ENCONTRADA' | 'ERROR_INTERNO';
  message: string;
  entregasIncompletas?: Array<{
    id: string;
    cantidadEsperada: number;
    cantidadEntregada: number;
    status: string;
  }>;
  timestamp: string;
}

export interface PagarVentaSuccessResponse {
  success: true;
  message: string;
  venta: {
    id: string;
    ventaId: string;
    montoTotal: number;
    estado: 'PAGADA';
    fechaVenta: string;
    fechaPago: string;
  };
}

export type PagarVentaResponse = PagarVentaSuccessResponse | PagarVentaErrorResponse;

export const adaptPagarVentaResponse = (venta: GetVentaCuenta): PagarVentaSuccessResponse => {
  return {
    success: true,
    message: 'Venta pagada exitosamente',
    venta: {
      id: venta.id,
      ventaId: venta.ventaId,
      montoTotal: venta.montoTotal,
      estado: 'PAGADA',
      fechaVenta: new Date(venta.fechaVenta).toISOString(),
      fechaPago: new Date().toISOString(),
    },
  };
};

export const adaptPagarVentaErrorResponse = (
  error: string,
  message: string,
  entregasIncompletas?: any[]
): PagarVentaErrorResponse => {
  return {
    success: false,
    error: error as any,
    message,
    entregasIncompletas,
    timestamp: new Date().toISOString(),
  };
};
