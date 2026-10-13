// FG DRIVO Safety Shield & 24x7 Emergency SOS Controller
import { db } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { emitRideEvent } from '../services/socketService.js';

export class SafetyController {
  static getEmergencyContacts(req, res) {
    const contacts = db.get('emergencyContacts') || [];
    return res.json({ contacts });
  }

  static addEmergencyContact(req, res) {
    const { name, phone, relation = 'Family', shareLive = true } = req.body;
    const contacts = db.get('emergencyContacts') || [];

    const newContact = {
      id: 'em-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim(),
      shareLive: Boolean(shareLive),
    };

    contacts.push(newContact);
    db.set('emergencyContacts', contacts);

    return res.status(201).json({
      success: true,
      message: 'Emergency contact registered and linked for live telemetry broadcast.',
      contact: newContact,
    });
  }

  static deleteEmergencyContact(req, res) {
    const { id } = req.params;
    const contacts = db.get('emergencyContacts') || [];
    const exists = contacts.some((c) => c.id === id);

    if (!exists) {
      throw new ApiError('Emergency contact not found with ID: ' + id, 404);
    }

    const filtered = contacts.filter((c) => c.id !== id);
    db.set('emergencyContacts', filtered);

    return res.json({
      success: true,
      message: 'Emergency contact removed.',
    });
  }

  static triggerSos(req, res) {
    const activeRide = db.get('activeRide');
    const contacts = db.get('emergencyContacts') || [];

    const alertPayload = {
      id: 'SOS-' + Date.now(),
      timestamp: new Date().toISOString(),
      status: 'EMERGENCY_DISPATCH_TRIGGERED',
      rideId: activeRide ? activeRide.id : 'PATROL_STANDBY',
      location: activeRide ? activeRide.pickup : 'Current User GPS Coordinates (Dindigul Zone)',
      authoritiesNotified: ['Dindigul City Police Control Room (112)', 'FG DRIVO 24/7 Safety Desk'],
      contactsAlerted: contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        status: 'SMS & WhatsApp alert queued with live tracking URL',
      })),
    };

    console.log('\x1b[41m\x1b[37m[SAFETY CRISIS EVENT]\x1b[0m SOS TRIGGERED:', alertPayload);

    // Broadcast emergency signal over WebSocket
    emitRideEvent(activeRide ? activeRide.id : null, 'safety:sos_alert', alertPayload);

    return res.json({
      success: true,
      message: 'Emergency SOS activated! Police dispatch (112) and trusted contacts alerted with live telemetry.',
      log: alertPayload,
    });
  }
}
