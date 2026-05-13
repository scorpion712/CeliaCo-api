import { SaleType } from "../../sales";
import { PaginatedRequest, PaginatedResponse } from "../Paginated";

export type GetSalesRequest = PaginatedRequest & { 
  startDate?: Date;
  endDate?: Date;
  type?: number;
  customerName?: string;
};

export type GetSalesResponse = PaginatedResponse<Sale>;

type Sale = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    total: number;
    customer: string;
    customerId: string | null;
    cae: string | null;
    type: SaleType;
    iva: number;
}
