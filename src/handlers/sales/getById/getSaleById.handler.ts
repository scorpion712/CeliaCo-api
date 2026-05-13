import { salesService } from "../../../services";
import { GetSaleByIdCommand } from "../../../models/request-response/sales/commands";

export interface GetSaleByIdResult {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  total: number;
  customer: string;
  customerId: string | null;
  cae: string | null;
  type: number;
  iva: number;
  details?: Array<{
    id: string;
    description: string;
    qty: number;
    total: number;
    ivaPct: number;
  }>;
}

/**
 * Simple handler for getting a single sale by ID.
 */
export const getSaleByIdHandler = async (command: GetSaleByIdCommand): Promise<GetSaleByIdResult> => {
  const sale = await salesService.getSaleById(command.id);
  return sale as GetSaleByIdResult;
};
