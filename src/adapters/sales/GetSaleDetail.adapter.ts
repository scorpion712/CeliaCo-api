import { GetSaleResponse, SaleItem } from "../../models";
import { GetSale } from "../../repositories/sales/models/GetSale";

// Format saleNumber with leading zeros (e.g., 1 -> "000000001")
const formatSaleNumber = (num: number): string => {
    return num.toString().padStart(9, '0');
};

export const adaptGetSaleDetailResponse = (response: GetSale): GetSaleResponse => { 
    return {
        id: response.id,
        saleNumber: formatSaleNumber(response.saleNumber),
        createdAt: response.createdAt, 
        updatedAt: response.createdAt,
        total: response.total,
        customer: response.customer,
        customerId: response.customerId,
        cae: response.cae,
        type: response.type,
        iva: response.iva,
        items: response.items.map((item: any): SaleItem => {
            return { 
                // Map to SaleItem type (from GetSaleResponse)
                product: item.productId,
                category: item.category || '',
                quantity: item.amount,
                total: item.itemTotal,
                iva: item.itemIVA,
            }
        })
    };
}