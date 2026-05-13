import { Request } from "express";
import Joi from "joi";
import { CuentaEstado } from "../../../models/cuentas/types";

export interface UpdateCuentaCommand {
  id: string;
  limiteCredito?: number;
  estado?: CuentaEstado;
}

const updateCuentaSchema = Joi.object({
  limiteCredito: Joi.number().min(0).optional(),
  estado: Joi.string().valid('ACTIVA', 'SALDADA', 'BLOQUEADA').optional(),
});

export const adaptUpdateCuenta = (req: Request): UpdateCuentaCommand => {
  const { error, value } = updateCuentaSchema.validate(req.body);
  
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return {
    id: req.params.id as string,
    limiteCredito: value.limiteCredito,
    estado: value.estado as CuentaEstado | undefined,
  };
};
