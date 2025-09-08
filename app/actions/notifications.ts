'use server';

import fs from 'fs/promises';
import path from 'path';
import { Job } from '@/app/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

export interface JobNotification {
  id: string;
  jobId: string;
  type: 'new_match' | 'about_to_expire' | 'status_update';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

async function loadNotifications(): Promise<JobNotification[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveNotifications(notifications: JobNotification[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
}

export async function createNotification(
  type: JobNotification['type'],
  jobId: string,
  message: string
): Promise<JobNotification> {
  const notifications = await loadNotifications();
  
  const newNotification: JobNotification = {
    id: `notification-${Date.now()}-${jobId}`,
    jobId,
    type,
    message,
    isRead: false,
    createdAt: new Date()
  };

  notifications.unshift(newNotification);
  await saveNotifications(notifications);
  return newNotification;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const notifications = await loadNotifications();
  const updatedNotifications = notifications.map(notification =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification
  );
  await saveNotifications(updatedNotifications);
}

export async function getUnreadNotifications(): Promise<JobNotification[]> {
  const notifications = await loadNotifications();
  return notifications.filter(n => !n.isRead);
}

export async function getAllNotifications(): Promise<JobNotification[]> {
  return loadNotifications();
}

export async function clearOldNotifications(daysOld: number = 30): Promise<void> {
  const notifications = await loadNotifications();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const filteredNotifications = notifications.filter(notification =>
    new Date(notification.createdAt) > cutoffDate
  );

  await saveNotifications(filteredNotifications);
}
