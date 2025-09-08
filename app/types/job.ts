export type JobSource = 'linkedin' | 'upwork' | 'freelancer' | 'indeed' | 'glassdoor';
export type JobRegion = 'APAC' | 'EU' | 'NA' | 'OTHER';
export type JobCategory = 'DevSecOps' | 'DevOps' | 'SRE' | 'Cloud' | 'Other';
export type JobStatus = 'active' | 'expired' | 'ignored' | 'applied';
export type ContractType = 'remote' | 'hybrid' | 'onsite' | 'contract' | 'permanent';

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hour' | 'month' | 'year';
}

export interface JobMetadata {
  isBookmarked: boolean;
  isIgnored: boolean;
  ignoredAt?: Date;
  appliedAt?: Date;
  notes?: string;
  tags?: string[];
  restoredFromIgnored?: boolean;
  restoredAt?: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: SalaryRange;
  contractType: ContractType;
  url: string;
  source: JobSource;
  sourceData: {
    originalId: string;
    originalUrl: string;
    originalPostedDate: string;
    applicationUrl?: string;
    requirements?: string[];
    benefits?: string[];
  };
  category: JobCategory;
  region: JobRegion;
  skills: string[];
  postedAt: Date;
  expiresAt?: Date;
  status: JobStatus;
  metadata: JobMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSearchFilters {
  categories?: JobCategory[];
  regions?: JobRegion[];
  skills?: string[];
  status?: JobStatus[];
  contractTypes?: ContractType[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  isBookmarked?: boolean;
  isIgnored?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}