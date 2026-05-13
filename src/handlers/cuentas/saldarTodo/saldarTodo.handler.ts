import { cuentaCorrienteService } from "../../../services";
import { MetodoPago } from "../../../models/cuentas/types";
import { GetVentaCuenta } from "../../../repositories/cuentas/models/GetVentaCuenta";
import { Entrega } from "../../../models/cuentas/types";

export interface SaldarTodoCommand {
  cuentaId: string;
  metodoPago: MetodoPago;
  descripcion?: string;
  createdBy?: string;
}

export interface SaldarTodoResult {
  entrega: Entrega;
  ventasPagadas: GetVentaCuenta[];
  saldoAnterior: number;
  saldoNuevo: number;
}

export const saldarTodoHandler = async (
  command: SaldarTodoCommand
): Promise<SaldarTodoResult> => {
  const result = await cuentaCorrienteService.saldarTodo(
    command.cuentaId,
    command.metodoPago,
    command.descripcion,
    command.createdBy
  );

  return {
    entrega: result.entrega,
    ventasPagadas: result.ventasPagadas,
    saldoAnterior: result.entrega.monto + (0), // We don't have saldoAnterior directly, but entrega.monto = saldoAnterior - saldoNuevo
    saldoNuevo: 0,
  };
};
