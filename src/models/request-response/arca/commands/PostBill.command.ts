export interface PostBillCommand {
  cartItems: {
    product: {
      price: number;
      iva: number;
    };
    qty: number;
  }[];
  customer: {
    ivaCategory: string;
    fiscalId?: string;
    dni?: string;
  };
  voucher?: number;
}
