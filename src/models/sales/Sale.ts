export type Sale = {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  total: number;
  customer: string;
  customerId: string | null;
  cae: string | null;
  type: number;
  iva: number;
};