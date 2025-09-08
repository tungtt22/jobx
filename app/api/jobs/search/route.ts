import { NextRequest } from 'next/server';
import { JobSearchService } from '@/app/lib/services/jobSearchService';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';

const jobSearchService = new JobSearchService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');

    if (!query) {
      return errorResponse('Search query is required');
    }

    const jobs = await jobSearchService.searchAndSaveJobs(query, location || undefined);

    return successResponse({
      jobs,
      total: jobs.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}
