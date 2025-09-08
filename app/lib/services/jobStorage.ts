import fs from 'fs/promises';
import path from 'path';
import { Job, JobSearchFilters, JobUpdate } from '@/app/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const JOBS_HISTORY_FILE = path.join(DATA_DIR, 'jobs-history.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load jobs from file
async function loadJobs(): Promise<Job[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(JOBS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Save jobs to file
async function saveJobs(jobs: Job[]) {
  await ensureDataDir();
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

// Load jobs history
async function loadJobsHistory(): Promise<Job[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(JOBS_HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save jobs to history
async function saveJobHistory(job: Job) {
  const history = await loadJobsHistory();
  history.push(job);
  await fs.writeFile(JOBS_HISTORY_FILE, JSON.stringify(history, null, 2));
}

export class JobStorage {
  private jobs: Job[] = [];
  private initialized = false;

  private async initialize() {
    if (!this.initialized) {
      this.jobs = await loadJobs();
      this.initialized = true;
    }
  }

  async addJob(job: Job): Promise<Job> {
    await this.initialize();
    
    // Check if job already exists
    const existingJob = this.jobs.find(j => 
      j.source === job.source && 
      j.sourceData.originalId === job.sourceData.originalId
    );

    if (existingJob) {
      // Update existing job
      Object.assign(existingJob, {
        ...job,
        updatedAt: new Date(),
        metadata: {
          ...existingJob.metadata,
          ...job.metadata
        }
      });
    } else {
      // Add new job
      this.jobs.push({
        ...job,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          isBookmarked: false,
          isIgnored: false,
          ...job.metadata
        }
      });
    }

    await saveJobs(this.jobs);
    return existingJob || job;
  }

  async updateJob(id: string, update: JobUpdate): Promise<Job | null> {
    await this.initialize();
    
    const job = this.jobs.find(j => j.id === id);
    if (!job) return null;

    // Update job
    Object.assign(job, {
      ...update,
      updatedAt: new Date(),
      metadata: {
        ...job.metadata,
        ...update.metadata
      }
    });

    await saveJobs(this.jobs);
    return job;
  }

  async markJobExpired(id: string): Promise<Job | null> {
    await this.initialize();
    
    const job = this.jobs.find(j => j.id === id);
    if (!job) return null;

    // Move to history and update status
    job.status = 'expired';
    job.updatedAt = new Date();
    await saveJobHistory(job);

    // Remove from active jobs
    this.jobs = this.jobs.filter(j => j.id !== id);
    await saveJobs(this.jobs);

    return job;
  }

  async toggleBookmark(id: string): Promise<Job | null> {
    await this.initialize();
    
    const job = this.jobs.find(j => j.id === id);
    if (!job) return null;

    job.metadata.isBookmarked = !job.metadata.isBookmarked;
    job.updatedAt = new Date();

    await saveJobs(this.jobs);
    return job;
  }

  async toggleIgnore(id: string): Promise<Job | null> {
    await this.initialize();
    
    const job = this.jobs.find(j => j.id === id);
    if (!job) return null;

    job.metadata.isIgnored = !job.metadata.isIgnored;
    job.metadata.ignoredAt = job.metadata.isIgnored ? new Date() : undefined;
    job.updatedAt = new Date();

    await saveJobs(this.jobs);
    return job;
  }

  async searchJobs(filters: JobSearchFilters): Promise<Job[]> {
    await this.initialize();
    
    return this.jobs.filter(job => {
      // Apply filters
      if (filters.categories && !filters.categories.includes(job.category)) return false;
      if (filters.regions && !filters.regions.includes(job.region)) return false;
      if (filters.status && !filters.status.includes(job.status)) return false;
      if (filters.isBookmarked !== undefined && job.metadata.isBookmarked !== filters.isBookmarked) return false;
      if (filters.isIgnored !== undefined && job.metadata.isIgnored !== filters.isIgnored) return false;
      
      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        const hasRequiredSkills = filters.skills.every(skill => 
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (!hasRequiredSkills) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const jobDate = new Date(job.postedAt);
        if (jobDate < filters.dateRange.start || jobDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  async getJobHistory(): Promise<Job[]> {
    return loadJobsHistory();
  }
}
