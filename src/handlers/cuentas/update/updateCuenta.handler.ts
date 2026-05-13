import { cuentaCorrienteService } from "../../../services";
import { CuentaEstado } from "../../../models/cuentas/types";

export interface UpdateCuentaCommand {
  id: string;
  limiteCredito?: number;
  estado?: CuentaEstado;
}

export interface UpdateCuentaResult {
  success: boolean;
}

export const updateCuentaHandler = async (
  command: UpdateCuentaCommand
): Promise<UpdateCuentaResult> => {
  await cuentaCorrienteService.updateCuenta(command.id, {
    limiteCredito: command.limiteCredito,
    estado: command.estado,
  });

  return { success: true };
};
