import { salesService } from "../../../services";
import { UpdateSaleCommand } from "../../../models/request-response/sales/commands";
import { UpdateSaleRequest } from "../../../models";

export interface UpdateSaleResult {
  id: string;
}

/**
 * Simple handler for updating a sale.
 */
export const updateSaleHandler = async (command: UpdateSaleCommand): Promise<UpdateSaleResult> => {
  const request: UpdateSaleRequest = {
    id: command.id,
    arcaData: command.arcaData,
  };

  const result = await salesService.updateSale(request);
  return result as UpdateSaleResult;
};
