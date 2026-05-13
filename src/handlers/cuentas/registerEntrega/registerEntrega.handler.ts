import { cuentaCorrienteService } from "../../../services";
import { Entrega, MetodoPago } from "../../../models/cuentas/types";

export interface RegistrarEntregaCommand {
  cuentaId: string;
  monto: number;
  metodoPago: MetodoPago;
  descripcion?: string;
  aplicarAVentaId?: string;
  createdBy?: string;
}

export interface RegistrarEntregaResult {
  entrega: Entrega;
}

export const registerEntregaHandler = async (
  command: RegistrarEntregaCommand
): Promise<RegistrarEntregaResult> => {
  const entrega = await cuentaCorrienteService.registrarEntrega(
    command.cuentaId,
    command.monto,
    command.metodoPago,
    command.descripcion,
    command.aplicarAVentaId,
    command.createdBy
  );

  return { entrega };
};
