import { Request } from "express";
import { GetCuentasCommand } from "../../../handlers/cuentas/get/getCuentas.handler";

export const adaptGetCuentas = (req: Request): GetCuentasCommand => {
  const { estado, clienteNombre, startDate, endDate, limit, offset } = req.query;

  return {
    estado: estado as any,
    clienteNombre: clienteNombre as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  };
};
