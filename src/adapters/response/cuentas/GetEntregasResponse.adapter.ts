import { Entrega } from '../../../models/cuentas/types';

export interface GetEntregasResponseDTO {
  data: {
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
  }[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const adaptGetEntregasResponse = (
  data: Entrega[],
  total: number,
  limit: number,
  offset: number
): GetEntregasResponseDTO => {
  return {
    data: data.map(e => ({
      id: e.id,
      cuentaId: e.cuentaId,
      monto: e.monto,
      metodoPago: e.metodoPago,
      descripcion: e.descripcion,
      detalleAplicacion: e.detalleAplicacion,
      createdAt: e.createdAt,
    })),
    pagination: {
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
