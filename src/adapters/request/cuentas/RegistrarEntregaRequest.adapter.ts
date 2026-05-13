import { Request } from "express";
import Joi from "joi";
import { MetodoPago } from "../../../models/cuentas/types";

export interface RegistrarEntregaCommand {
  cuentaId: string;
  monto: number;
  metodoPago: MetodoPago;
  descripcion?: string;
  aplicarAVentaId?: string;
  createdBy?: string;
}

const registrarEntregaSchema = Joi.object({
  monto: Joi.number().positive().required(),
  metodoPago: Joi.string().valid('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'TARJETA', 'OTRO').required(),
  descripcion: Joi.string().optional(),
  aplicarAVentaId: Joi.string().uuid().optional(),
  createdBy: Joi.string().optional(),
});

export const adaptRegistrarEntrega = (req: Request): RegistrarEntregaCommand => {
  const { error, value } = registrarEntregaSchema.validate(req.body);
  
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return {
    cuentaId: req.params.id as string,
    monto: value.monto,
    metodoPago: value.metodoPago as MetodoPago,
    descripcion: value.descripcion,
    aplicarAVentaId: value.aplicarAVentaId,
    createdBy: value.createdBy,
  };
};
