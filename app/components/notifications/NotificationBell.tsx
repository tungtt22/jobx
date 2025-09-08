'use client';

import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { JobNotification } from '@/app/actions/notifications';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<JobNotification[]>([]);

  useEffect(() => {
    loadNotifications();
    // Kiểm tra thông báo mới mỗi phút
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications?unread=true');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId
        })
      });
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Request desktop notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notifications
            </h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No new notifications
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-4 p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark as read
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 p-4">
              <button
                onClick={() => {
                  notifications.forEach(n => handleMarkAsRead(n.id));
                  setShowDropdown(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}