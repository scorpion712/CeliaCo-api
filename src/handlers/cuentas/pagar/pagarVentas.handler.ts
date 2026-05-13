import { cuentaCorrienteService } from "../../../services";
import { MetodoPago } from "../../../models/cuentas/types";
import { GetVentaCuenta } from "../../../repositories/cuentas/models/GetVentaCuenta";
import { Entrega } from "../../../models/cuentas/types";

export interface PagarVentasCommand {
  cuentaId: string;
  ventaIds: string[];
  monto: number;
  metodoPago: MetodoPago;
  descripcion?: string;
  createdBy?: string;
}

export interface PagarVentasResult {
  entrega: Entrega;
  ventasActualizadas: GetVentaCuenta[];
  saldoAnterior: number;
  saldoNuevo: number;
}

export const pagarVentasHandler = async (
  command: PagarVentasCommand
): Promise<PagarVentasResult> => {
  const result = await cuentaCorrienteService.pagarVentas(
    command.cuentaId,
    command.ventaIds,
    command.monto,
    command.metodoPago,
    command.descripcion,
    command.createdBy
  );

  // Get current cuenta for saldo info
  const cuenta = await cuentaCorrienteService.getCuentaById(command.cuentaId);
  
  return {
    entrega: result.entrega,
    ventasActualizadas: result.ventasActualizadas,
    saldoAnterior: cuenta ? cuenta.saldoActual + command.monto : 0,
    saldoNuevo: cuenta ? cuenta.saldoActual : 0,
  };
};
