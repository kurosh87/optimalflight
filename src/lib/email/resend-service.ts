/**
 * Resend Email Service
 * Send transactional and drip campaign emails
 */

import { Resend } from 'resend';
import { render } from '@react-email/components';
import WelcomeEmail from '@/emails/welcome';
import Day2VirtualInterliningEmail from '@/emails/day-2-virtual-interlining';
import Day13TrialEndingEmail from '@/emails/day-13-trial-ending';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = 'FlightOptima <hello@flightoptima.com>'; // Change to your verified domain

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send welcome email (Day 0)
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<EmailResult> {
  try {
    const emailHtml = await render(WelcomeEmail({ userName, userEmail: email }));

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to FlightOptima - Find Better Flights! ✈️',
      html: emailHtml,
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('Welcome email failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Day 2 feature highlight email
 */
export async function sendDay2Email(
  email: string,
  userName?: string
): Promise<EmailResult> {
  try {
    const emailHtml = await render(Day2VirtualInterliningEmail({ userName }));

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Routes Nobody Else Offers - Virtual Interlining Explained',
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send Day 13 trial ending reminder
 */
export async function sendDay13Email(
  email: string,
  userName: string | undefined,
  trialEndsDate: string
): Promise<EmailResult> {
  try {
    const emailHtml = await render(Day13TrialEndingEmail({ userName, trialEndsDate }));

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '⏰ Your FlightOptima trial ends tomorrow - Don\'t lose access!',
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send price alert notification
 */
export async function sendPriceAlertEmail(
  email: string,
  route: { origin: string; destination: string },
  oldPrice: number,
  newPrice: number,
  savings: number
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `💰 Price Drop Alert: ${route.origin} to ${route.destination} - Save $${savings}!`,
      html: `
        <h1>Price Drop Detected!</h1>
        <p>Great news! The price for your saved route dropped:</p>
        <p><strong>${route.origin} → ${route.destination}</strong></p>
        <p>Was: $${oldPrice}</p>
        <p>Now: $${newPrice}</p>
        <p><strong>Save $${savings}!</strong></p>
        <a href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app/search?origin=${route.origin}&destination=${route.destination}" style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
          Search This Route
        </a>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  tier: string,
  price: number
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🎉 Welcome to FlightOptima Pro!',
      html: `
        <h1>Thank You for Subscribing!</h1>
        <p>You're now a FlightOptima ${tier} member.</p>
        <p>Your premium features are now active:</p>
        <ul>
          <li>✓ Unlimited searches</li>
          <li>✓ Alliance filtering</li>
          <li>✓ Jetlag optimization</li>
          <li>✓ Price alerts</li>
          <li>✓ Ad-free experience</li>
        </ul>
        <p>Amount: $${price}/year</p>
        <a href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app/search" style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
          Start Searching
        </a>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
