import { LinkedInJobSource } from '../job-sources/linkedin';
import { UpworkJobSource } from '../job-sources/upwork';
import { JobStorage } from './jobStorage';
import { Job, JobCategory, JobRegion, JobSearchFilters } from '@/app/types/job';

export class JobSearchService {
  private linkedinSource: LinkedInJobSource;
  private upworkSource: UpworkJobSource;
  private jobStorage: JobStorage;

  constructor() {
    this.linkedinSource = new LinkedInJobSource();
    this.upworkSource = new UpworkJobSource();
    this.jobStorage = new JobStorage();
  }

  private getDefaultCategories(): JobCategory[] {
    return ['DevSecOps', 'DevOps', 'SRE'];
  }

  private getDefaultRegions(): JobRegion[] {
    return ['APAC', 'EU'];
  }

  async searchAndSaveJobs(query: string, location?: string): Promise<Job[]> {
    try {
      // Search jobs from all sources in parallel
      const [linkedinJobs, upworkJobs] = await Promise.all([
        this.linkedinSource.searchJobs(query, location),
        this.upworkSource.searchJobs(query)
      ]);

      // Filter jobs by default categories and regions
      const defaultCategories = this.getDefaultCategories();
      const defaultRegions = this.getDefaultRegions();

      const filteredJobs = [...linkedinJobs, ...upworkJobs].filter(job =>
        defaultCategories.includes(job.category) &&
        defaultRegions.includes(job.region)
      );

      // Save all jobs
      const savedJobs = await Promise.all(
        filteredJobs.map(job => this.jobStorage.addJob(job))
      );

      return savedJobs;
    } catch (error) {
      console.error('Error searching jobs:', error);
      return [];
    }
  }

  async getJobs(filters?: JobSearchFilters): Promise<Job[]> {
    // Apply default filters if none provided
    const searchFilters: JobSearchFilters = {
      categories: this.getDefaultCategories(),
      regions: this.getDefaultRegions(),
      ...filters
    };

    return this.jobStorage.searchJobs(searchFilters);
  }

  async toggleBookmark(jobId: string): Promise<Job | null> {
    return this.jobStorage.toggleBookmark(jobId);
  }

  async toggleIgnore(jobId: string): Promise<Job | null> {
    return this.jobStorage.toggleIgnore(jobId);
  }

  async markExpired(jobId: string): Promise<Job | null> {
    return this.jobStorage.markJobExpired(jobId);
  }

  async getHistory(): Promise<Job[]> {
    return this.jobStorage.getJobHistory();
  }

  async updateJobNotes(jobId: string, notes: string): Promise<Job | null> {
    return this.jobStorage.updateJob(jobId, { notes });
  }

  async markJobApplied(jobId: string): Promise<Job | null> {
    return this.jobStorage.updateJob(jobId, {
      status: 'applied',
      metadata: {
        appliedAt: new Date()
      }
    });
  }
}
