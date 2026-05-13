export type GetSale = {
    id: string;
    saleNumber: number;
    createdAt: Date;
    total: number;
    customer: string;
    customerId: string | null;
    cae: string | null;
    type: number;
    iva: number;
    items: SaleDetail[];
}

type SaleDetail = {
    productId: string;
    productName: string;
    amount: number;
    category: string;
    itemTotal: number;
    itemIVA: number;
}