import { Entrega } from '../../../models/cuentas/types';

export interface RegistrarEntregaResponseDTO {
  id: string;
  cuentaId: string;
  monto: number;
  metodoPago: string;
  descripcion?: string;
  detalleAplicacion: {
    ventaId: string;
    montoAplicado: number;
  }[];
  createdAt: Date;
}

export const adaptRegistrarEntregaResponse = (entrega: Entrega): RegistrarEntregaResponseDTO => {
  return {
    id: entrega.id,
    cuentaId: entrega.cuentaId,
    monto: entrega.monto,
    metodoPago: entrega.metodoPago,
    descripcion: entrega.descripcion,
    detalleAplicacion: entrega.detalleAplicacion,
    createdAt: entrega.createdAt,
  };
};
