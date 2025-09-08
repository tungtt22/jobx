import { JobCategory, JobRegion } from './job';

export interface Settings {
  tokens: {
    linkedin?: string;
    upwork?: string;
    indeed?: string;
    glassdoor?: string;
  };
  defaultFilters: {
    categories: JobCategory[];
    regions: JobRegion[];
  };
  notifications: {
    desktop: boolean;
    email: boolean;
    emailAddress?: string;
  };
  jobPreferences: {
    minSalary?: number;
    currency: string;
    contractTypes: string[];
    remoteOnly: boolean;
  };
}
