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

// Utility Functions
export async function loadCollectedJobs(): Promise<CollectedJobs> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Convert dates back to Date objects
    if (parsed.lastUpdated) parsed.lastUpdated = new Date(parsed.lastUpdated);
    return parsed;
  } catch (err) {
    // If file doesn't exist, return empty structure
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
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(JOBS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getCollectionLog(): Promise<CollectionLog[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(COLLECTION_LOG_FILE, 'utf-8');
    const logs = JSON.parse(data);
    // Convert dates back to Date objects
    return logs.map((log: CollectionLog) => ({
      ...log,
      lastRun: new Date(log.lastRun)
    }));
  } catch (err) {
    return [];
  }
}

async function logCollection(log: CollectionLog): Promise<void> {
  const logs = await getCollectionLog();
  logs.push({
    ...log,
    lastRun: log.lastRun instanceof Date ? log.lastRun : new Date(log.lastRun)
  });
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(COLLECTION_LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

function removeDuplicates(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const key = job.id || job.url;
    if (!key) continue;
    // If duplicate, keep the one with the latest date
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (
        job.postedAt &&
        (!existing.postedAt || new Date(job.postedAt) > new Date(existing.postedAt))
      ) {
        seen.set(key, job);
      }
    } else {
      seen.set(key, job);
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
    // Count by source
    stats.bySource[job.source] = (stats.bySource[job.source] || 0) + 1;
    // Count by category
    stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1;
    // Count by region
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

  // Save everything
  await saveCollectedJobs(updatedData);
  collectionLog.totalCollected = allNewJobs.length;
  await logCollection(collectionLog);

  return {
    newJobs: allNewJobs.length,
    totalJobs: uniqueJobs.length,
    stats: updatedData.stats
  };
}