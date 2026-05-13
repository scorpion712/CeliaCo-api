export type GetProduct = {
    total: number;
    data: Product[];
}

type Product = {
    id: string; 
    code: string;
    name: string; 
    description: string;
    stock: number;
    isEnabled: boolean;
    allowSaleWithoutStock: boolean;
    stockMandatory: boolean;
    deletedAt: Date | null;
}
