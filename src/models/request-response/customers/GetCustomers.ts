import { PaginatedRequest, PaginatedResponse } from "../Paginated";

export type GetCustomersRequest = PaginatedRequest & {
    tab?: string;
    search?: string;
};

export type GetCustomersResponse = PaginatedResponse<Customer>;

type Customer = {
    id: string; 
    name: string; 
    phone: string; 
    fiscalId: string;
    idNumber: string;
    ivaCategory: string; 
}