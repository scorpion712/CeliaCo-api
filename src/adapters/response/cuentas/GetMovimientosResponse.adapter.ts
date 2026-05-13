import { GetMovimiento } from '../../../repositories/cuentas/models/GetMovimiento';

export interface GetMovimientosResponseDTO {
  data: GetMovimiento[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const adaptGetMovimientosResponse = (
  data: GetMovimiento[],
  total: number,
  limit: number,
  offset: number
): GetMovimientosResponseDTO => {
  return {
    data,
    pagination: {
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
