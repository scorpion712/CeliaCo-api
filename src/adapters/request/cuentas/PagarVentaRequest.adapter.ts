import { Request } from 'express';
import { PagarVentaCommand } from '../../../handlers/cuentas/pagar/pagarVenta.handler';

export const adaptPagarVenta = (req: Request): PagarVentaCommand => {
  return {
    cuentaId: req.params.id as string,
    ventaId: req.params.ventaId as string,
  };
};
