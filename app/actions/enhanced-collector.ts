'use server';

import { EnhancedJobCollector } from '@/app/lib/job-sources/enhanced-collector';
import fs from 'fs/promises';
import path from 'path';
import { Job } from '@/app/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'collected-jobs.json');

export interface CollectedJobs {
  jobs: Job[];
  lastUpdated: Date;
  stats: any;
}

export async function saveCollectedJobs(data: CollectedJobs): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(JOBS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving collected jobs:', error);
    throw error;
  }
}

export async function loadCollectedJobs(): Promise<CollectedJobs> {
  try {
    const data = await fs.readFile(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      lastUpdated: new Date(parsed.lastUpdated)
    };
  } catch (error) {
    console.error('Error loading collected jobs:', error);
    return {
      jobs: [],
      lastUpdated: new Date(),
      stats: {}
    };
  }
}

export interface CollectionRequest {
  queries: string[];
  locations?: string[];
  categories?: string[];
  maxJobsPerSource?: number;
  sources?: string[];
}

export interface CollectionResponse {
  success: boolean;
  totalJobs: number;
  newJobs: number;
  sources: {
    [sourceName: string]: {
      success: boolean;
      jobsCollected: number;
      errors?: string[];
    };
  };
  stats: any;
  duration: number;
}

export async function collectJobsFromMultipleSources(
  request: CollectionRequest
): Promise<CollectionResponse> {
  try {
    console.log('Starting enhanced job collection with request:', request);

    // Initialize collector with custom config
    const collector = new EnhancedJobCollector({
      maxJobsPerSource: request.maxJobsPerSource || 50,
      delayBetweenRequests: 2000,
      retryAttempts: 3,
      timeout: 30000
    });

    // Collect jobs from all sources
    const result = await collector.collectJobs(
      request.queries,
      request.locations,
      request.categories
    );

    if (!result.success) {
      throw new Error('Job collection failed');
    }

    // Load existing jobs
    const existingData = await loadCollectedJobs();
    
    // Merge with existing jobs
    const allJobs = [...existingData.jobs, ...result.totalJobs];
    
    // Remove duplicates
    const uniqueJobs = removeDuplicates(allJobs);
    
    // Calculate comprehensive stats
    const stats = collector.getCollectionStats(uniqueJobs);
    
    // Save updated jobs
    const updatedData = {
      jobs: uniqueJobs,
      lastUpdated: new Date(),
      stats
    };
    
    await saveCollectedJobs(updatedData);

    return {
      success: true,
      totalJobs: uniqueJobs.length,
      newJobs: result.newJobs,
      sources: result.sources,
      stats,
      duration: result.duration
    };

  } catch (error) {
    console.error('Enhanced collection error:', error);
    throw new Error(`Collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getJobStatistics(): Promise<any> {
  try {
    const data = await loadCollectedJobs();
    return {
      totalJobs: data.jobs.length,
      lastUpdated: data.lastUpdated,
      stats: data.stats,
      sources: getSourceBreakdown(data.jobs),
      categories: getCategoryBreakdown(data.jobs),
      regions: getRegionBreakdown(data.jobs)
    };
  } catch (error) {
    console.error('Error getting job statistics:', error);
    throw new Error('Failed to retrieve job statistics');
  }
}

export async function searchJobs(
  query: string,
  filters?: {
    source?: string;
    category?: string;
    region?: string;
    contractType?: string;
    limit?: number;
  }
): Promise<any[]> {
  try {
    const data = await loadCollectedJobs();
    let jobs = data.jobs;

    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.skills?.some(skill => skill.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filters?.source) {
      jobs = jobs.filter(job => job.source === filters.source);
    }
    if (filters?.category) {
      jobs = jobs.filter(job => job.category === filters.category);
    }
    if (filters?.region) {
      jobs = jobs.filter(job => job.region === filters.region);
    }
    if (filters?.contractType) {
      jobs = jobs.filter(job => job.contractType === filters.contractType);
    }

    // Sort by posted date (most recent first)
    jobs.sort((a, b) => {
      const dateA = a.postedAt?.getTime() || 0;
      const dateB = b.postedAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Limit results
    if (filters?.limit) {
      jobs = jobs.slice(0, filters.limit);
    }

    return jobs;

  } catch (error) {
    console.error('Error searching jobs:', error);
    throw new Error('Failed to search jobs');
  }
}

export async function getAvailableSources(): Promise<string[]> {
  try {
    const data = await loadCollectedJobs();
    const sources = new Set(data.jobs.map(job => job.source));
    return Array.from(sources).sort();
  } catch (error) {
    console.error('Error getting available sources:', error);
    return [];
  }
}

export async function getAvailableCategories(): Promise<string[]> {
  try {
    const data = await loadCollectedJobs();
    const categories = new Set(data.jobs.map(job => job.category));
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting available categories:', error);
    return [];
  }
}

export async function getAvailableRegions(): Promise<string[]> {
  try {
    const data = await loadCollectedJobs();
    const regions = new Set(data.jobs.map(job => job.region));
    return Array.from(regions).sort();
  } catch (error) {
    console.error('Error getting available regions:', error);
    return [];
  }
}

// Helper functions
function removeDuplicates(jobs: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const job of jobs) {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase();
    
    if (!seen.has(key)) {
      seen.set(key, job);
    } else {
      // Keep the more recent job
      const existing = seen.get(key)!;
      if (job.postedAt && (!existing.postedAt || job.postedAt > existing.postedAt)) {
        seen.set(key, job);
      }
    }
  }
  
  return Array.from(seen.values());
}

function getSourceBreakdown(jobs: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  jobs.forEach(job => {
    breakdown[job.source] = (breakdown[job.source] || 0) + 1;
  });
  return breakdown;
}

function getCategoryBreakdown(jobs: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  jobs.forEach(job => {
    breakdown[job.category] = (breakdown[job.category] || 0) + 1;
  });
  return breakdown;
}

function getRegionBreakdown(jobs: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  jobs.forEach(job => {
    breakdown[job.region] = (breakdown[job.region] || 0) + 1;
  });
  return breakdown;
}
