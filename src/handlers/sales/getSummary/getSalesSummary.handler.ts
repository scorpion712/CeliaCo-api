import { salesService } from "../../../services";
import { GetSalesSummaryRequest, GetSalesSummaryResponse } from "../../../models";

export interface GetSalesSummaryCommand {
  initDate?: Date;
  endDate?: Date;
}

/**
 * Simple handler for getting sales summary.
 */
export const getSalesSummaryHandler = async (command: GetSalesSummaryCommand): Promise<GetSalesSummaryResponse> => {
  const request: GetSalesSummaryRequest = {
    initDate: command.initDate,
    endDate: command.endDate,
  };
  return salesService.getSalesSummary(request);
};
