import { Request } from "express";

export interface GetMovimientosCommand {
  cuentaId: string;
  tipo?: 'COMPRA' | 'ENTREGA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DESESTIMACION';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const adaptGetMovimientos = (req: Request): GetMovimientosCommand => {
  const { tipo, startDate, endDate, limit, offset } = req.query;

  return {
    cuentaId: req.params.id as string,
    tipo: tipo as any,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  };
};
