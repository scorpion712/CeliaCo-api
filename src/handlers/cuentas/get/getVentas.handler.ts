import { cuentaCorrienteService } from "../../../services";
import { GetVentaCuenta } from "../../../repositories/cuentas/models/GetVentaCuenta";

export interface GetVentasCommand {
  cuentaId: string;
}

export interface GetVentasResult {
  ventas: GetVentaCuenta[];
}

export const getVentasHandler = async (
  command: GetVentasCommand
): Promise<GetVentasResult> => {
  const ventas = await cuentaCorrienteService.getVentas(command.cuentaId);
  return { ventas };
};
