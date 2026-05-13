export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type PaginatedRequest = {
  offset: number;
  limit: number;
};
