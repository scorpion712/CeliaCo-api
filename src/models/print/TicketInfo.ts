type CustomerIVA =
  | "Consumidor Final"
  | "Exento"
  | "Responsable Inscripto"
  | "Monotributista";
export interface CartItem {
  qty: number;
  description: string;
  ivaPct: number;
  total: number;
}

interface Customer {
  type: CustomerIVA;
  name?: string;
  cuit?: string;
  category?: string;
  address?: string;
}

export interface SaleData {
  saleNumber: string; // "0001-00000001"
  date: Date;
  items: CartItem[];
  total: number;
  totalIva: number;
  cae: string;
  caeExpiry: Date;
  qr: string; // código generado por ARCA
}

type ArcaData = {
  ptoVenta: string;
  nroVenta: string;
  nroCbte: number;
  cae: string;
  caeExpiry: string;
  qrData: string;
};

export type TicketInfo = {
  arcaData: ArcaData | null;
  items: CartItem[];
  total: number;
  totalIva: number;
  customer: Customer;
  date: Date;
};
