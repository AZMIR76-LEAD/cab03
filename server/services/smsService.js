// FG DRIVO SMS Dispatch Gateway Service
// Supports Mock Mode, Fast2SMS (India), Twilio (Global), and MSG91

export class SMSService {
  /**
   * Dispatch 6-digit OTP to mobile phone
   * @param {{ phone: string, code: string, provider?: string, webhookUrl?: string }} params
   */
  static async sendOtp({ phone, code, provider: customProvider, webhookUrl: customWebhookUrl }) {
    const rawApiKey = process.env.SMS_API_KEY || '';
    const provider = (customProvider || process.env.SMS_GATEWAY_PROVIDER || (rawApiKey ? 'fast2sms' : 'mock')).toLowerCase();
    const apiKey = rawApiKey;

    // Normalize phone number (strip whitespace and special chars)
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const indian10Digits = rawDigits.slice(-10);

    // 1. FAST2SMS (India - DLT / Quick SMS / OTP API)
    if (provider === 'fast2sms' && apiKey) {
      try {
        console.log(`\x1b[36m[Fast2SMS Gateway]\x1b[0m Dispatching live OTP to +91 ${indian10Digits}...`);
        
        let response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
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

        let data = await response.json();

        // If OTP route requires website verification (996), attempt Quick route
        if (data && data.status_code === 996) {
          console.log(`\x1b[33m[Fast2SMS Gateway]\x1b[0m OTP route requires site verification, trying route 'q'...`);
          response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'q',
              message: `Your FG DRIVO verification code is: ${code}`,
              flash: 0,
              numbers: indian10Digits,
            }),
          });
          data = await response.json();
        }

        if (data && data.return) {
          console.log(`\x1b[32m[Fast2SMS Gateway]\x1b[0m SMS sent successfully:`, data.request_id || 'OK');
          return { success: true, provider: 'fast2sms', data, code };
        } else {
          console.warn(`\x1b[31m[Fast2SMS Gateway]\x1b[0m API notice:`, data.message || data);
          return { success: false, provider: 'fast2sms', error: data.message, code };
        }
      } catch (err) {
        console.error(`\x1b[31m[Fast2SMS Gateway]\x1b[0m Network error:`, err.message);
        return { success: false, provider: 'fast2sms', error: err.message, code };
      }
    }

    // 2. n8n WORKFLOW AUTOMATION WEBHOOK
    if (provider === 'n8n' || process.env.N8N_WEBHOOK_URL || customWebhookUrl) {
      const webhookUrl = customWebhookUrl || process.env.N8N_WEBHOOK_URL || apiKey;
      if (!webhookUrl) {
        console.warn(`\x1b[33m[n8n Gateway]\x1b[0m Missing N8N_WEBHOOK_URL in environment.`);
        return { success: false, provider: 'n8n', error: 'N8N_WEBHOOK_URL is not set.' };
      }

      try {
        console.log(`\x1b[36m[n8n Automation Gateway]\x1b[0m Dispatching to n8n webhook: ${webhookUrl}...`);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.N8N_API_KEY ? { 'X-N8N-API-KEY': process.env.N8N_API_KEY } : {}),
          },
          body: JSON.stringify({
            phone: phone,
            raw10Digits: indian10Digits,
            code: code,
            action: 'SEND_OTP',
            appName: 'FG DRIVO',
            message: `Your FG DRIVO verification code is: ${code}. Valid for 5 minutes.`,
            timestamp: new Date().toISOString(),
          }),
        });

        const data = await response.json().catch(() => ({}));
        console.log(`\x1b[32m[n8n Automation Gateway]\x1b[0m Workflow executed:`, data);

        return {
          success: true,
          provider: 'n8n',
          data,
          code: data.code || data.otp || code,
        };
      } catch (err) {
        console.error(`\x1b[31m[n8n Automation Gateway]\x1b[0m Webhook network error:`, err.message);
        return { success: false, provider: 'n8n', error: err.message };
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
      message: 'Unknown provider or mock mode active.',
      demoCode: code,
    };
  }
}
