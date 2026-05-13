import { GetSalesRequest, GetSalesResponse, GetSalesSummaryRequest, GetSalesSummaryResponse, Sale, UpdateSaleRequest } from "../../models";
import { GetFiscalSale } from "./models/GetFiscalSale";
import { GetSale } from "./models/GetSale";

export interface DailySalesByType {
  tipo: number;
  total: number;
  count: number;
}

export interface ISalesRepository {
  createSale(sale: Sale): Promise<string>;
  getSales(filter: GetSalesRequest): Promise<GetSalesResponse>;
  getSaleById(saleId: string): Promise<GetSale>;
  updateSale(sale: UpdateSaleRequest): Promise<Sale | null>;
  deleteSale(saleId: string): Promise<void>;
  deleteSales(saleIds: string[]): Promise<void>;
  hardDeleteSale(saleId: string): Promise<void>;
  getSalesSummary(filter: GetSalesSummaryRequest): Promise<GetSalesSummaryResponse>;
  getFiscalSaleById(saleId: string): Promise<GetFiscalSale>;
  getDailySalesByType(date?: string): Promise<DailySalesByType[]>;
}