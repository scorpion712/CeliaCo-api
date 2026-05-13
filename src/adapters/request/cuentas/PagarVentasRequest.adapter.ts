import { Request } from "express";
import Joi from "joi";
import { MetodoPago } from "../../../models/cuentas/types";

export interface PagarVentasCommand {
  cuentaId: string;
  ventaIds: string[];
  monto: number;
  metodoPago: MetodoPago;
  descripcion?: string;
  createdBy?: string;
}

const pagarVentasSchema = Joi.object({
  ventaIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  monto: Joi.number().positive().required(),
  metodoPago: Joi.string().valid('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'TARJETA', 'OTRO').required(),
  descripcion: Joi.string().optional(),
  createdBy: Joi.string().optional(),
});

export const adaptPagarVentas = (req: Request): PagarVentasCommand => {
  const { error, value } = pagarVentasSchema.validate(req.body);
  
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return {
    cuentaId: req.params.id as string,
    ventaIds: value.ventaIds,
    monto: value.monto,
    metodoPago: value.metodoPago as MetodoPago,
    descripcion: value.descripcion,
    createdBy: value.createdBy,
  };
};
