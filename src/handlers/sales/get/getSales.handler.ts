import { salesService } from "../../../services";
import { GetSalesCommand } from "../../../models/request-response/sales/commands";
import { GetSalesResponse } from "../../../models";

/**
 * Simple handler for listing sales with filters.
 * Transforms request to command, calls service, returns response.
 */
export const getSalesHandler = async (command: GetSalesCommand): Promise<GetSalesResponse> => {
  return salesService.getSales(command);
};
