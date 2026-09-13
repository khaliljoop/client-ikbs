export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}