import { NextRequest } from 'next/server';
import { JobSearchService } from '@/app/lib/services/jobSearchService';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';

const jobSearchService = new JobSearchService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      isBookmarked: searchParams.get('bookmarked') === 'true',
      isIgnored: searchParams.get('ignored') === 'true',
      status: searchParams.getAll('status'),
    };

    const jobs = await jobSearchService.getJobs(filters);

    return successResponse({
      jobs,
      total: jobs.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, jobId, data } = await request.json();

    let result;
    switch (action) {
      case 'bookmark':
        result = await jobSearchService.toggleBookmark(jobId);
        break;
      case 'ignore':
        result = await jobSearchService.toggleIgnore(jobId);
        break;
      case 'expire':
        result = await jobSearchService.markExpired(jobId);
        break;
      case 'apply':
        result = await jobSearchService.markJobApplied(jobId);
        break;
      case 'notes':
        result = await jobSearchService.updateJobNotes(jobId, data.notes);
        break;
      default:
        return errorResponse('Invalid action');
    }

    if (!result) {
      return errorResponse('Job not found');
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
