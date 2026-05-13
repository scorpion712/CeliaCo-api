import { cuentaCorrienteService } from "../../../services";
import { Entrega } from "../../../models/cuentas/types";

export interface GetEntregasCommand {
  cuentaId: string;
  limit?: number;
  offset?: number;
}

export interface GetEntregasResult {
  entregas: {
    data: Entrega[];
    total: number;
  };
}

export const getEntregasHandler = async (
  command: GetEntregasCommand
): Promise<GetEntregasResult> => {
  const entregas = await cuentaCorrienteService.getEntregas(
    command.cuentaId,
    command.limit ?? 20,
    command.offset ?? 0
  );
  return { entregas };
};
