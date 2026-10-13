// FG DRIVO User Profile Controller
import { db } from '../db.js';

export class UserController {
  static getProfile(req, res) {
    const user = db.get('user');
    return res.json(user);
  }

  static updateProfile(req, res) {
    const { name, phone, email } = req.body;
    const user = db.get('user');

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

    db.set('user', user);

    return res.json({
      success: true,
      message: 'Profile information updated successfully.',
      user,
    });
  }
}
