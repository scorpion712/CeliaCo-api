import { GetCuentasResponse } from '../../../repositories/cuentas/ICuentasCorrientesRepository.interface';
import { CuentaListItem } from '../../../models/cuentas/types';

export interface GetCuentasResponseDTO {
  data: CuentaListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const adaptGetCuentasResponse = (response: GetCuentasResponse): GetCuentasResponseDTO => {
  return {
    data: response.data.map(cuenta => ({
      id: cuenta.id,
      clienteId: cuenta.clienteId,
      clienteNombre: cuenta.clienteNombre || '',
      estado: cuenta.estado,
      saldoActual: cuenta.saldoActual,
      limiteCredito: cuenta.limiteCredito,
      createdAt: cuenta.createdAt,
    })),
    pagination: response.pagination,
  };
};
