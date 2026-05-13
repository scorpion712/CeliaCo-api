import { Request } from "express";
import Joi from "joi";

export interface CreateCuentaCommand {
  clienteId: string;
  limiteCredito?: number;
}

const createCuentaSchema = Joi.object({
  clienteId: Joi.string().uuid().required(),
  limiteCredito: Joi.number().min(0).optional(),
});

export const adaptCreateCuenta = (req: Request): CreateCuentaCommand => {
  const { error, value } = createCuentaSchema.validate(req.body);
  
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return {
    clienteId: value.clienteId,
    limiteCredito: value.limiteCredito,
  };
};
