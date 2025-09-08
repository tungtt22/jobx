import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';
import { loadSettings, saveSettings } from '@/app/actions/settings';

export async function GET() {
  try {
    const settings = await loadSettings();
    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    await saveSettings(settings);
    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}