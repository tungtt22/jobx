import { NextRequest } from 'next/server';
import { JobSearchService } from '@/app/lib/services/jobSearchService';
import { successResponse, handleApiError } from '@/app/lib/api-utils';

const jobSearchService = new JobSearchService();

export async function GET(request: NextRequest) {
  try {
    const jobs = await jobSearchService.getHistory();

    return successResponse({
      jobs,
      total: jobs.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}
