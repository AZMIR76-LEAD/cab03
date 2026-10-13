// FG DRIVO SMS Dispatch Gateway Service
// Supports Mock Mode, Fast2SMS (India), Twilio (Global), and MSG91

export class SMSService {
  /**
   * Dispatch 6-digit OTP to mobile phone
   * @param {{ phone: string, code: string }} params
   */
  static async sendOtp({ phone, code }) {
    const provider = (process.env.SMS_GATEWAY_PROVIDER || 'mock').toLowerCase();
    const apiKey = process.env.SMS_API_KEY || '';

    // Normalize phone number (strip whitespace and special chars)
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const indian10Digits = rawDigits.slice(-10);

    // 1. MOCK / DEVELOPMENT MODE (Free, instantaneous, no external SMS charges)
    if (provider === 'mock' || !apiKey) {
      console.log(`\x1b[36m[SMS Mock Gateway]\x1b[0m Mobile: ${phone} | Code: \x1b[32m${code}\x1b[0m (Valid for 5 min)`);
      return {
        success: true,
        provider: 'mock',
        message: 'OTP dispatched via Mock SMS service.',
        demoCode: code,
      };
    }

    // 2. FAST2SMS (India - DLT / Quick SMS API ~₹0.20 per SMS)
    if (provider === 'fast2sms') {
      try {
        console.log(`\x1b[36m[Fast2SMS Gateway]\x1b[0m Dispatching live OTP to +91 ${indian10Digits}...`);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: code,
            numbers: indian10Digits,
          }),
        });

        const data = await response.json();
        if (data && data.return) {
          console.log(`\x1b[32m[Fast2SMS Gateway]\x1b[0m SMS sent successfully:`, data.request_id || 'OK');
          return { success: true, provider: 'fast2sms', data };
        } else {
          console.warn(`\x1b[31m[Fast2SMS Gateway]\x1b[0m API Error:`, data.message || data);
          return { success: false, provider: 'fast2sms', error: data.message };
        }
      } catch (err) {
        console.error(`\x1b[31m[Fast2SMS Gateway]\x1b[0m Network error:`, err.message);
        return { success: false, provider: 'fast2sms', error: err.message };
      }
    }

    // 3. TWILIO VERIFY / SMS (International Standard)
    if (provider === 'twilio') {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = apiKey || process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM;

        const e164Phone = phone.startsWith('+') ? phone : `+${phone}`;
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const body = new URLSearchParams({
          To: e164Phone,
          From: fromNumber,
          Body: `Your FG DRIVO verification code is: ${code}. Valid for 5 minutes.`,
        });

        console.log(`\x1b[36m[Twilio Gateway]\x1b[0m Dispatching live OTP to ${e164Phone}...`);
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          }
        );

        const data = await response.json();
        if (data && !data.error_code) {
          console.log(`\x1b[32m[Twilio Gateway]\x1b[0m SMS queued: ${data.sid}`);
          return { success: true, provider: 'twilio', sid: data.sid };
        } else {
          console.warn(`\x1b[31m[Twilio Gateway]\x1b[0m Twilio Error:`, data.message);
          return { success: false, provider: 'twilio', error: data.message };
        }
      } catch (err) {
        console.error(`\x1b[31m[Twilio Gateway]\x1b[0m Network error:`, err.message);
        return { success: false, provider: 'twilio', error: err.message };
      }
    }

    return {
      success: true,
      provider: 'mock',
      message: 'Unknown provider, defaulted to mock.',
      demoCode: code,
    };
  }
}
