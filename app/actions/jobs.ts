'use server';

import fs from 'fs/promises';
import path from 'path';
import { Job } from '@/app/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'collected-jobs.json');
const COLLECTION_LOG_FILE = path.join(DATA_DIR, 'collection-log.json');

export type CollectionLogSource = {
  name: string;
  count: number;
  error?: string;
};

export type CollectionLog = {
  lastRun: Date;
  totalCollected: number;
  sources: CollectionLogSource[];
};

export type CollectedJobs = {
  jobs: Job[];
  lastUpdated: Date;
  stats: {
    totalJobs: number;
    bySource: Record<string, number>;
    byCategory: Record<string, number>;
    byRegion: Record<string, number>;
  };
};

export async function getJobs(filters?: {
  sources?: string[];
  categories?: string[];
  regions?: string[];
  search?: string;
}): Promise<CollectedJobs> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(JOBS_FILE, 'utf-8');
    let jobs: CollectedJobs = JSON.parse(data);

    // Convert dates
    jobs.lastUpdated = new Date(jobs.lastUpdated);

    // Apply filters if any
    if (filters) {
      jobs.jobs = jobs.jobs.filter(job => {
        if (filters.sources?.length && !filters.sources.includes(job.source)) return false;
        if (filters.categories?.length && !filters.categories.includes(job.category)) return false;
        if (filters.regions?.length && !filters.regions.includes(job.region)) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            job.title.toLowerCase().includes(search) ||
            job.description.toLowerCase().includes(search) ||
            job.company.toLowerCase().includes(search)
          );
        }
        return true;
      });

      // Recalculate stats for filtered jobs
      jobs.stats = calculateStats(jobs.jobs);
    }

    return jobs;
  } catch {
    return {
      jobs: [],
      lastUpdated: new Date(),
      stats: {
        totalJobs: 0,
        bySource: {},
        byCategory: {},
        byRegion: {}
      }
    };
  }
}

export async function getCollectionHistory(): Promise<CollectionLog[]> {
  try {
    const data = await fs.readFile(COLLECTION_LOG_FILE, 'utf-8');
    const logs = JSON.parse(data);
    return logs.map((log: CollectionLog) => ({
      ...log,
      lastRun: new Date(log.lastRun)
    }));
  } catch {
    return [];
  }
}

function calculateStats(jobs: Job[]) {
  const stats = {
    totalJobs: jobs.length,
    bySource: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byRegion: {} as Record<string, number>
  };

  jobs.forEach(job => {
    stats.bySource[job.source] = (stats.bySource[job.source] || 0) + 1;
    stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1;
    stats.byRegion[job.region] = (stats.byRegion[job.region] || 0) + 1;
  });

  return stats;
}
