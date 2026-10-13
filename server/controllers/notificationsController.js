// FG DRIVO Push & In-App Notifications Controller
import { db } from '../db.js';

export class NotificationsController {
  static getNotifications(req, res) {
    const notifications = db.get('notifications') || [];
    const unreadCount = notifications.filter((n) => n.unread).length;
    return res.json({
      success: true,
      unreadCount,
      notifications,
    });
  }

  static markAllAsRead(req, res) {
    const notifications = db.get('notifications') || [];
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    db.set('notifications', updated);

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
      notifications: updated,
    });
  }
}
