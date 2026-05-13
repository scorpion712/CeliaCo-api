import { cuentaCorrienteService } from "../../../services";
import { GetCuentaWithCliente } from "../../../repositories/cuentas/models/GetCuenta";

export interface CreateCuentaCommand {
  clienteId: string;
  limiteCredito?: number;
}

export interface CreateCuentaResult {
  cuenta: GetCuentaWithCliente;
}

export const createCuentaHandler = async (
  command: CreateCuentaCommand
): Promise<CreateCuentaResult> => {
  const cuenta = await cuentaCorrienteService.createCuenta(
    command.clienteId,
    command.limiteCredito
  );

  return { cuenta };
};
