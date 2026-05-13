import { salesService } from "../../../services";
import { DeleteSaleCommand } from "../../../models/request-response/sales/commands";

export interface DeleteSaleResult {
  success: boolean;
}

/**
 * Simple handler for deleting a sale.
 */
export const deleteSaleHandler = async (command: DeleteSaleCommand): Promise<DeleteSaleResult> => {
  await salesService.deleteSale(command.id);
  return { success: true };
};
