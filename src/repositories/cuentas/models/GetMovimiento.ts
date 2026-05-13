/**
 * Repository model for getting movimientos de cuenta
 */
export type GetMovimiento = {
  id: string;
  cuentaId: string;
  tipo: 'COMPRA' | 'ENTREGA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DESESTIMACION';
  referenciaId?: string;
  referenciaTipo?: string;
  monto: number; // Positive for charges, negative for credits
  saldoAnterior: number;
  saldoNuevo: number;
  descripcion?: string;
  createdAt: Date;
};