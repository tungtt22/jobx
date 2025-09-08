import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';
import {
  getAllApplications,
  getActiveApplications,
  getApplicationStatus,
  trackApplication,
  updateStatus,
  addNextStep,
  completeNextStep,
  addContact,
  addOffer,
  getUpcomingSteps
} from '@/app/actions/applications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const activeOnly = searchParams.get('active') === 'true';
    const upcoming = searchParams.get('upcoming') === 'true';

    if (jobId) {
      const status = await getApplicationStatus(jobId);
      return successResponse(status);
    }

    if (upcoming) {
      const steps = await getUpcomingSteps();
      return successResponse(steps);
    }

    const applications = activeOnly
      ? await getActiveApplications()
      : await getAllApplications();

    return successResponse(applications);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, ...data } = body;

    let result;
    switch (action) {
      case 'track':
        result = await trackApplication(jobId);
        break;

      case 'update_status':
        result = await updateStatus(jobId, data.status, data.notes);
        break;

      case 'add_step':
        result = await addNextStep(jobId, data.action, new Date(data.dueDate));
        break;

      case 'complete_step':
        result = await completeNextStep(jobId, data.stepIndex);
        break;

      case 'add_contact':
        result = await addContact(jobId, data.contact);
        break;

      case 'add_offer':
        result = await addOffer(jobId, data.compensation);
        break;

      default:
        return errorResponse('Invalid action');
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
