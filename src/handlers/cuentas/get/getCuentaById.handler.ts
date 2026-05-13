import { cuentaCorrienteService } from "../../../services";
import { GetCuentaWithCliente } from "../../../repositories/cuentas/models/GetCuenta";
import createHttpError from 'http-errors';

export interface GetCuentaByIdCommand {
  id: string;
}

export interface GetCuentaByIdResult {
  cuenta: GetCuentaWithCliente;
}

export const getCuentaByIdHandler = async (
  command: GetCuentaByIdCommand
): Promise<GetCuentaByIdResult> => {
  const cuenta = await cuentaCorrienteService.getCuentaById(command.id);
  
  if (!cuenta) {
    throw createHttpError(404, 'Account not found');
  }

  return { cuenta };
};
