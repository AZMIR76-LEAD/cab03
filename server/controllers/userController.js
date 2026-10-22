// FG DRIVO User Profile Controller
import { db } from '../db.js';

export class UserController {
  static async getProfile(req, res) {
    const user = (await db.getUserFromReq(req)) || db.get('user');
    return res.json(user);
  }

  static async updateProfile(req, res) {
    const { name, phone, email } = req.body;
    const user = (await db.getUserFromReq(req)) || db.get('user');

    if (name) {
      user.name = name.trim();
      user.greetingName = name.trim().split(' ')[0];
    }
    if (phone) {
      user.phone = phone.trim();
    }
    if (email) {
      user.email = email.trim();
    }

    if (db.isPostgresConnected && db.pgPool && user.id) {
      try {
        await db.pgPool.query(
          'UPDATE users SET name = $1, greeting_name = $2, phone = $3, email = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
          [user.name, user.greetingName, user.phone, user.email, user.id]
        );
      } catch (e) {
        console.warn('Failed to update user in Supabase:', e.message);
      }
    }

    db.set('user', user);

    return res.json({
      success: true,
      message: 'Profile information updated successfully.',
      user,
    });
  }
}
