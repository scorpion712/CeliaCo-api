import { SaleType } from "../../../sales";

export interface CreateSaleCommand {
  total: number;
  type: SaleType;
  cartItems: CreateSaleCartItem[];
  customerId?: string;
  arcaData?: CreateSaleArca;
  iva?: number;
}

export interface CreateSaleCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  iva: number;
  total: number;
}

export interface CreateSaleArca {
  cae?: string;
  afip?: {
    CAE: string;
    CAEFchVto: string;
  };
  nroCbte?: number;
  ptoVenta?: string;
  qrData?: string;
}
