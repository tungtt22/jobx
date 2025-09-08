import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';
import { exportApplicationHistory, exportJobSearch } from '@/app/actions/exports';
import { getAllApplications } from '@/app/actions/applications';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    let filePath;
    switch (type) {
      case 'applications':
        const applications = data || await getAllApplications();
        filePath = await exportApplicationHistory(applications);
        break;

      case 'jobs':
        filePath = await exportJobSearch(data);
        break;

      default:
        return errorResponse('Invalid export type');
    }

    // Return the relative path for download
    const relativePath = filePath.split('/exports/')[1];
    return successResponse({ path: relativePath });
  } catch (error) {
    return handleApiError(error);
  }
}
