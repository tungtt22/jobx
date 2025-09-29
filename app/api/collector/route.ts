import { NextRequest, NextResponse } from 'next/server';
import { EnhancedJobCollector } from '@/app/lib/job-sources/enhanced-collector';
import { saveCollectedJobs, loadCollectedJobs } from '@/app/actions/enhanced-collector';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'collected-jobs.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      queries = ['devops', 'sre', 'finops'],
      locations = ['Remote', 'Vietnam'],
      categories = ['DevOps', 'SRE', 'FinOps'],
      contractTypes = ['remote', 'hybrid', 'freelance'],
      maxJobsPerSource = 50
    } = body;

    console.log('Starting unified job collection...');
    console.log('Queries:', queries);
    console.log('Locations:', locations);
    console.log('Categories:', categories);

    // Initialize collector
    const collector = new EnhancedJobCollector({
      maxJobsPerSource,
      delayBetweenRequests: 2000,
      retryAttempts: 3,
      timeout: 30000
    });

    // Collect jobs
    const result = await collector.collectJobs(queries, locations, categories, contractTypes);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Job collection failed', details: result },
        { status: 500 }
      );
    }

    // For now, just return the collection result
    // The enhanced collector doesn't return the actual jobs array
    // This would need to be modified to return the jobs array

    return NextResponse.json({
      success: true,
      message: 'Jobs collected successfully',
      result: {
        ...result,
        totalJobsCollected: result.totalJobs,
        newJobsAdded: result.newJobs
      }
    });

  } catch (error) {
    console.error('Unified collection error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Load from collected-jobs.json
    const data = await loadCollectedJobs();
    let jobs = data.jobs;

    // Apply filters
    if (source) {
      jobs = jobs.filter(job => job.source === source);
    }
    if (category) {
      jobs = jobs.filter(job => job.category === category);
    }
    if (region) {
      jobs = jobs.filter(job => job.region === region);
    }

    // Limit results
    jobs = jobs.slice(0, limit);

    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
      stats: data.stats,
      lastUpdated: data.lastUpdated.toISOString()
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve jobs' },
      { status: 500 }
    );
  }
}

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