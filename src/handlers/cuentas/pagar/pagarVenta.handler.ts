import { cuentaCorrienteService } from "../../../services";
import { GetVentaCuenta } from "../../../repositories/cuentas/models/GetVentaCuenta";

export interface PagarVentaCommand {
  cuentaId: string;
  ventaId: string;
}

export interface PagarVentaResult {
  venta: GetVentaCuenta;
}

export const pagarVentaHandler = async (
  command: PagarVentaCommand
): Promise<PagarVentaResult> => {
  const venta = await cuentaCorrienteService.pagarVenta(
    command.cuentaId,
    command.ventaId
  );

  return { venta };
};
