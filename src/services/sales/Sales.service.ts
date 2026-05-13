import { adaptGetSaleDetailResponse } from "../../adapters";
import { CreateSaleRequest, GetSalesRequest, GetSalesSummaryRequest, Sale, UpdateSaleRequest } from "../../models"
import { ISalesRepository } from "../../repositories/sales";
import { DailySalesByType } from "../../repositories/sales/ISalesRepository.interface";

export class SalesService {
    constructor(private saleRepository: ISalesRepository) {}

    async createSale(request: CreateSaleRequest) { 
        return await this.saleRepository.createSale({
            createdAt: new Date(),
            total: request.total,
            type: request.type,
            customerId: request.customerId ?? null,
            cae: request.arcaData?.afip?.CAE ?? null,
            iva: request.iva ?? 0,
            updatedAt: new Date(),
        } as Sale); 
    }

    async getSales(filter: GetSalesRequest) {
        return await this.saleRepository.getSales(filter);
    }

    async getSaleById(saleId: string) {
        const sale = await this.saleRepository.getSaleById(saleId);
        return adaptGetSaleDetailResponse(sale);
    }

    async updateSale(updatedSale: UpdateSaleRequest) {
        return await this.saleRepository.updateSale(updatedSale);
    }

    async deleteSale(saleId: string) {
        return await this.saleRepository.deleteSale(saleId);
    }

    async getSalesSummary(filter: GetSalesSummaryRequest) {
        return await this.saleRepository.getSalesSummary(filter);
    }

    async getDailySalesByType(date?: string): Promise<DailySalesByType[]> {
        return await this.saleRepository.getDailySalesByType(date);
    }
}