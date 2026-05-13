import { PaginatedRequest } from "../../models";

export const validatePaginationQuery = (params: PaginatedRequest): Required<PaginatedRequest> => { 
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 100;

  return {
    offset: Math.max(0, params.offset || 0),
    limit: params.limit 
      ? Math.min(MAX_LIMIT, Math.max(1, params.limit))
      : DEFAULT_LIMIT
  };
};