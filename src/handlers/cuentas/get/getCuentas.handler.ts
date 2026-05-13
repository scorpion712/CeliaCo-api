import { cuentaCorrienteService } from "../../../services";
import { GetCuentasResponse } from "../../../repositories/cuentas/ICuentasCorrientesRepository.interface";

export interface GetCuentasCommand {
  estado?: 'ACTIVA' | 'SALDADA' | 'BLOQUEADA';
  clienteNombre?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetCuentasResult {
  cuentas: GetCuentasResponse;
}

export const getCuentasHandler = async (
  command: GetCuentasCommand
): Promise<GetCuentasResult> => {
  const cuentas = await cuentaCorrienteService.getCuentas({
    estado: command.estado,
    clienteNombre: command.clienteNombre,
    startDate: command.startDate,
    endDate: command.endDate,
    limit: command.limit ?? 20,
    offset: command.offset ?? 0,
  });

  return { cuentas };
};
