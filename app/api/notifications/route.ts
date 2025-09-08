import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  createNotification
} from '@/app/actions/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const notifications = unreadOnly
      ? await getUnreadNotifications()
      : await getAllNotifications();

    return successResponse(notifications);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, notificationId, notification } = await request.json();

    switch (action) {
      case 'mark_read':
        await markAsRead(notificationId);
        return successResponse({ message: 'Notification marked as read' });

      case 'create':
        const newNotification = await createNotification(
          notification.type,
          notification.jobId,
          notification.message
        );
        return successResponse(newNotification);

      default:
        return errorResponse('Invalid action');
    }
  } catch (error) {
    return handleApiError(error);
  }
}
