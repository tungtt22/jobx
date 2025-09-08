import { NextRequest } from 'next/server';
import { searchAllJobs } from '@/app/lib/job-sources/aggregator';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get search parameters
    const query = searchParams.get('query');
    if (!query) {
      return errorResponse('Search query is required');
    }

    const params = {
      query,
      location: searchParams.get('location') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Search jobs from all sources
    const results = await searchAllJobs(params);

    return successResponse({
      jobs: results.jobs,
      total: results.jobs.length,
      sources: Object.keys(results.sources),
      page: params.page,
      limit: params.limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Cache configuration for the API route
export const dynamic = 'force-dynamic'; // Disable caching for real-time results
export const revalidate = 300; // Revalidate cache every 5 minutes
