import { SalesCartItem } from "../../models";
import { SaleDetail } from "./models/SaleDetail";

export interface ISaleDetailsRepository {
  createSaleDetail(cartItems: SalesCartItem[]): Promise<string>;
}