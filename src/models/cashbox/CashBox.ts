export interface CashBox {
  id: string;
  fecha: Date;
  apertura: number;
  cierre: number | null;
  cerrada: boolean;
  createdAt: Date;
  updatedAt: Date;
}