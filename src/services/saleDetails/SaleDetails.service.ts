import { SalesCartItem } from "../../models";
import { ISaleDetailsRepository } from "../../repositories";

export class SaleDetailsService {
    constructor(private saleDetailsRepository: ISaleDetailsRepository) {}

    async createSaleDetail(cartItems: SalesCartItem[]) {
        return await this.saleDetailsRepository.createSaleDetail(cartItems);
    }
} 