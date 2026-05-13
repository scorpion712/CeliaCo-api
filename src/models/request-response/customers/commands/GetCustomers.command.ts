export interface GetCustomersCommand {
  limit: number;
  offset: number;
  tab?: string;
  search?: string;
}
