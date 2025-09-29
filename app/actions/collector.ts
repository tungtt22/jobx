'use server';

import fs from 'fs/promises';
import path from 'path';
import { Job } from '@/app/types/job';
import { LinkedInJobSource } from '../lib/job-sources/linkedin';
import { UpworkJobSource } from '../lib/job-sources/upwork';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'collected-jobs.json');
const COLLECTION_LOG_FILE = path.join(DATA_DIR, 'collection-log.json');

// Types
export interface CollectionLogSource {
  name: string;
  count: number;
  error?: string;
}

export interface CollectionLog {
  lastRun: Date;
  totalCollected: number;
  sources: CollectionLogSource[];
}

export interface CollectedJobs {
  jobs: Job[];
  lastUpdated: Date;
  stats: {
    totalJobs: number;
    bySource: Record<string, number>;
    byCategory: Record<string, number>;
    byRegion: Record<string, number>;
  };
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

export async function loadCollectedJobs(): Promise<CollectedJobs> {
  try {
    await ensureDataDir();
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
      stats: {
        totalJobs: 0,
        bySource: {},
        byCategory: {},
        byRegion: {}
      }
    };
  }
}

export async function saveCollectedJobs(data: CollectedJobs): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(JOBS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving collected jobs:', error);
    throw error;
  }
}

export async function saveCollectionLog(log: CollectionLog): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(COLLECTION_LOG_FILE, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error('Error saving collection log:', error);
  }
}

function removeDuplicates(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  
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

function calculateStats(jobs: Job[]): CollectedJobs['stats'] {
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

export async function collectJobs(searchQueries: string[]) {
  const sources = [
    { name: 'linkedin', source: new LinkedInJobSource() },
    { name: 'upwork', source: new UpworkJobSource() }
  ];

  const collectionLog: CollectionLog = {
    lastRun: new Date(),
    totalCollected: 0,
    sources: []
  };

  const existingData = await loadCollectedJobs();
  let allNewJobs: Job[] = [];

  // Collect from all sources with retries
  for (const { name, source } of sources) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const sourceJobs: Job[] = [];
        for (const query of searchQueries) {
          // Add delay between queries
          if (sourceJobs.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

          const jobs = await source.searchJobs(query);
          sourceJobs.push(...jobs);
        }

        collectionLog.sources.push({
          name,
          count: sourceJobs.length
        });
        allNewJobs.push(...sourceJobs);
        break; // Success, exit retry loop

      } catch (error) {
        retryCount++;
        console.error(`Error collecting from ${name} (attempt ${retryCount}):`, error);
        
        if (retryCount === maxRetries) {
          collectionLog.sources.push({
            name,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        }
      }
    }
  }

  // Remove duplicates from new jobs
  allNewJobs = removeDuplicates(allNewJobs);

  // Merge with existing jobs, keeping newer versions of duplicates
  const allJobs = [...allNewJobs, ...existingData.jobs];
  const uniqueJobs = removeDuplicates(allJobs);

  // Update collection data
  const updatedData: CollectedJobs = {
    jobs: uniqueJobs,
    lastUpdated: new Date(),
    stats: calculateStats(uniqueJobs)
  };

  await saveCollectedJobs(updatedData);
  await saveCollectionLog(collectionLog);

  return {
    success: true,
    totalJobs: uniqueJobs.length,
    newJobs: allNewJobs.length,
    sources: collectionLog.sources
  };
}
