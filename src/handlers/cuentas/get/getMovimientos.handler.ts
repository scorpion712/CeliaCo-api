import { cuentaCorrienteService } from "../../../services";
import { GetMovimiento } from "../../../repositories/cuentas/models/GetMovimiento";

export interface GetMovimientosCommand {
  cuentaId: string;
  tipo?: 'COMPRA' | 'ENTREGA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DESESTIMACION';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetMovimientosResult {
  movimientos: {
    data: GetMovimiento[];
    total: number;
  };
}

export const getMovimientosHandler = async (
  command: GetMovimientosCommand
): Promise<GetMovimientosResult> => {
  const movimientos = await cuentaCorrienteService.getMovimientos(command.cuentaId, {
    tipo: command.tipo,
    startDate: command.startDate,
    endDate: command.endDate,
    limit: command.limit ?? 20,
    offset: command.offset ?? 0,
  });

  return { movimientos };
};
