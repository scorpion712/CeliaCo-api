import { Request } from "express";
import Joi from "joi";
import { MetodoPago } from "../../../models/cuentas/types";

export interface SaldarTodoCommand {
  cuentaId: string;
  metodoPago: MetodoPago;
  descripcion?: string;
  createdBy?: string;
}

const saldarTodoSchema = Joi.object({
  metodoPago: Joi.string().valid('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'TARJETA', 'OTRO').required(),
  descripcion: Joi.string().optional(),
  createdBy: Joi.string().optional(),
});

export const adaptSaldarTodo = (req: Request): SaldarTodoCommand => {
  const { error, value } = saldarTodoSchema.validate(req.body);
  
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return {
    cuentaId: req.params.id as string,
    metodoPago: value.metodoPago as MetodoPago,
    descripcion: value.descripcion,
    createdBy: value.createdBy,
  };
};
