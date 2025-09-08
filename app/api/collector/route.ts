import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';
import { collectJobs } from '@/app/actions/collector';
import { getJobs, getCollectionHistory } from '@/app/actions/jobs';

const DEFAULT_QUERIES = [
  'DevOps engineer',
  'Site Reliability Engineer',
  'DevSecOps engineer',
  'Cloud engineer',
  'Infrastructure engineer'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sources: searchParams.getAll('source'),
      categories: searchParams.getAll('category'),
      regions: searchParams.getAll('region'),
      search: searchParams.get('search') || undefined
    };

    // Get filtered jobs
    const data = await getJobs(
      Object.values(filters).some(v => v && v.length > 0) ? filters : undefined
    );

    // Get collection history
    const logs = await getCollectionHistory();
    const latestLog = logs[logs.length - 1];

    return successResponse({ 
      jobs: data.jobs,
      stats: data.stats,
      lastUpdated: data.lastUpdated,
      collectionLog: latestLog
    });
  } catch (error) {
    console.error('Error in GET /api/collector:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    let queries: string[];
    
    try {
      const body = await request.json();
      queries = Array.isArray(body?.queries) ? body.queries : DEFAULT_QUERIES;
    } catch (e) {
      queries = DEFAULT_QUERIES;
    }

    if (!queries.length) {
      return errorResponse('No valid search queries provided');
    }

    const result = await collectJobs(queries);

    return successResponse({
      message: 'Job collection completed',
      ...result
    });
  } catch (error) {
    console.error('Error in POST /api/collector:', error);
    return handleApiError(error);
  }
}