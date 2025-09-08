export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}