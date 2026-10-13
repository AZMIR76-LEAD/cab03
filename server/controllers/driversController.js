// FG DRIVO Captains & Fleet Telemetry Controller
import { db } from '../db.js';
import { CITY_INFO } from '../config/constants.js';

export class DriversController {
  static getNearby(req, res) {
    const drivers = db.get('drivers') || [];

    // Realistic telematics drift simulation (smooth micro-movements on city roads)
    const jittered = drivers.map((driver) => {
      const deltaX = (Math.random() * 0.4 - 0.2);
      const deltaY = (Math.random() * 0.4 - 0.2);
      const newX = Math.min(Math.max(driver.coords.x + deltaX, CITY_INFO.bounds.minX), CITY_INFO.bounds.maxX);
      const newY = Math.min(Math.max(driver.coords.y + deltaY, CITY_INFO.bounds.minY), CITY_INFO.bounds.maxY);

      return {
        ...driver,
        coords: {
          x: parseFloat(newX.toFixed(2)),
          y: parseFloat(newY.toFixed(2)),
        },
      };
    });

    return res.json({
      success: true,
      city: CITY_INFO.name,
      state: CITY_INFO.state,
      rtoCode: CITY_INFO.rtoCode,
      activeCabs: 184,
      count: jittered.length,
      drivers: jittered,
      timestamp: new Date().toISOString(),
    });
  }
}
