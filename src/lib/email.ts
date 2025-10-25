import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/welcome';
import { FlightReminderEmail } from '@/emails/flight-reminder';
import { PasswordResetEmail } from '@/emails/password-reset';
import { FlightDelayEmail } from '@/emails/flight-delay';
import { GateChangeEmail } from '@/emails/gate-change';
import { LightTherapyEmail } from '@/emails/light-therapy';
import { JetlagReminderEmail } from '@/emails/jetlag-reminder';

let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendWelcomeEmail(userEmail: string) {
  const resend = getResend();
  try {
    const { data, error } = await resend.emails.send({
      from: 'JetLag <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Welcome to JetLag!',
      react: WelcomeEmail({ userEmail }),
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendFlightReminder(
  userEmail: string,
  flightDetails: {
    flightNumber?: string;
    origin: string;
    destination: string;
    departureTime: string;
    hoursUntilFlight: number;
  }
) {
  const resend = getResend();
  try {
    const { data, error } = await resend.emails.send({
      from: 'JetLag <reminders@resend.dev>',
      to: [userEmail],
      subject: `Flight Reminder: ${flightDetails.origin} → ${flightDetails.destination}`,
      react: FlightReminderEmail(flightDetails),
    });

    if (error) {
      console.error('Error sending flight reminder:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending flight reminder:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(userEmail: string, resetLink: string) {
  const resend = getResend();
  try {
    const { data, error } = await resend.emails.send({
      from: 'JetLag <security@resend.dev>',
      to: [userEmail],
      subject: 'Reset Your JetLag Password',
      react: PasswordResetEmail({ userEmail, resetLink }),
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

export async function sendMagicLinkEmail(userEmail: string, magicLink: string) {
  const resend = getResend();
  try {
    const { data, error } = await resend.emails.send({
      from: 'JetLag <auth@resend.dev>',
      to: [userEmail],
      subject: 'Sign in to JetLag',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Sign in to JetLag</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
              <h1 style="color: #1a1a1a; font-size: 36px; text-align: center; margin-bottom: 30px;">✈️ JetLag</h1>
              <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Sign in to your account</h2>
              <p style="color: #525f7f; font-size: 16px; line-height: 24px;">
                Click the button below to sign in to your JetLag account:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background-color: #5469d4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block;">
                  Sign In
                </a>
              </div>
              <p style="color: #525f7f; font-size: 16px; line-height: 24px;">
                This link will expire in 15 minutes for security reasons.
              </p>
              <p style="color: #525f7f; font-size: 16px; line-height: 24px;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="color: #8898aa; font-size: 14px; margin-top: 30px;">
                Need help? Reply to this email or contact support.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending magic link email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return { success: false, error };
  }
}

export async function sendFlightDelayEmail(userEmail: string, data: any) {
  const resend = getResend();
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'JetLag <notifications@resend.dev>',
      to: [userEmail],
      subject: data.title || 'Flight Delayed',
      react: FlightDelayEmail(data),
    });

    if (error) {
      console.error('Error sending flight delay email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending flight delay email:', error);
    return { success: false, error };
  }
}

export async function sendGateChangeEmail(userEmail: string, data: any) {
  const resend = getResend();
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'JetLag <notifications@resend.dev>',
      to: [userEmail],
      subject: data.title || 'Gate Change Alert',
      react: GateChangeEmail(data),
    });

    if (error) {
      console.error('Error sending gate change email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending gate change email:', error);
    return { success: false, error };
  }
}

export async function sendLightTherapyEmail(userEmail: string, data: any) {
  const resend = getResend();
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'JetLag <notifications@resend.dev>',
      to: [userEmail],
      subject: data.title || 'Light Therapy Reminder',
      react: LightTherapyEmail(data),
    });

    if (error) {
      console.error('Error sending light therapy email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending light therapy email:', error);
    return { success: false, error };
  }
}

export async function sendJetlagReminderEmail(userEmail: string, data: any) {
  const resend = getResend();
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'JetLag <notifications@resend.dev>',
      to: [userEmail],
      subject: data.title || 'Jet Lag Recovery Reminder',
      react: JetlagReminderEmail(data),
    });

    if (error) {
      console.error('Error sending jetlag reminder email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending jetlag reminder email:', error);
    return { success: false, error };
  }
}
