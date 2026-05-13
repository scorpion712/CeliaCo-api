import { PaginatedRequest } from "../Paginated";

export type GetSalesSummaryRequest = {
    initDate?: Date;
    endDate?: Date;
};

export type GetSalesSummaryResponse = {
    data: SaleSummary[];
}

type SaleSummary = {
    sector: string;
    total: number;
}