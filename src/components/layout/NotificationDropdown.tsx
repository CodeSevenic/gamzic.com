'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  BellIcon,
  CheckIcon,
  TrophyIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  CalendarIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/firebase/db';
import type { Notification, NotificationType } from '@/types';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  comment_reply: <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />,
  tournament_update: <TrophyIcon className="w-5 h-5 text-yellow-400" />,
  match_reminder: <CalendarIcon className="w-5 h-5 text-orange-400" />,
  team_invite: <UserPlusIcon className="w-5 h-5 text-purple-400" />,
  follow: <UserPlusIcon className="w-5 h-5 text-cyan-400" />,
  mention: <AtSymbolIcon className="w-5 h-5 text-pink-400" />,
  tournament_registration: <TrophyIcon className="w-5 h-5 text-green-400" />,
  tournament_result: <TrophyIcon className="w-5 h-5 text-emerald-400" />,
};

export function NotificationDropdown() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const fetchedNotifications = await getNotifications(user.id);
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await markAllNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6 text-cyan-400" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold bg-cyan-500 text-white rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <CheckIcon className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-700">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.linkUrl || '#'}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div
                        className={`p-4 hover:bg-dark-700/50 transition-colors cursor-pointer ${
                          !notification.isRead ? 'bg-dark-700/30' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
                            {notificationIcons[notification.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'text-white font-medium' : 'text-dark-300'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-dark-400 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">
                              {format(notification.createdAt, 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

