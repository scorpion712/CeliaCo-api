export type GetSaleRequest = {
    id: string;
}

export type GetSaleResponse = {
    id: string;
    saleNumber: string;
    createdAt: Date;
    updatedAt: Date;
    total: number;
    customer: string;
    customerId: string | null;
    cae: string | null;
    type: number;
    iva: number;
    items: SaleItem[];
    ptoVenta?: string;
    nroVenta?: string;
    nroCbte?: number;
    qrData?: string;
}

export type SaleItem = { 
    product: string;
    category: string;
    quantity: number;
    total: number;
    iva: number;
}