export type GetFiscalSale = {
    id: string;
    createdAt: Date; 
    customerCategory: string;
    customerFiscalId: string;
    customerIdNumber: string;
    items: SaleDetail[];
} 

type SaleDetail = { 
    amount: number; 
    itemTotal: number;
    itemIVA: number;
}