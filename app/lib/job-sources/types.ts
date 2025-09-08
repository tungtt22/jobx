export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  url: string;
  source: 'linkedin' | 'upwork' | 'freelancer';
  postedAt?: Date;
  skills?: string[];
}

export interface JobSearchParams {
  query: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface JobSearchResult {
  jobs: ExternalJob[];
  total: number;
  hasMore: boolean;
  source: string;
}
