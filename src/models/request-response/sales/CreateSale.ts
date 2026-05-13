import { SaleType } from "../../sales";

export type CreateSaleRequest = {
  total: number;
  type: SaleType;
  cartItems: CartItem[];
  customerId?: string | null;
  arcaData?: Arca;
  iva?: number;
};

export type CreateSaleResponse = {
  id: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  iva: number;
  total: number;
};

type Arca = {
  cae?: string;
  afip?: {
    CAE: string;
    CAEFchVto: string;
  };
  nroCbte?: number;
  ptoVenta?: string;
  qrData?: string;
};