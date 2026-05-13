export interface GetSalesCommand {
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  type?: number;
  customerName?: string;
}
