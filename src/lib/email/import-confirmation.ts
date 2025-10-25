/**
 * Import Confirmation Emails
 * Send detailed results of flight import processing
 */

import { Resend } from 'resend';
import { getUserEmail } from '@/lib/email-import/user-helper';
import type { ProcessingResult } from '@/lib/email-import/types';
import { format } from 'date-fns';

let resend: Resend | null = null;
function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Send import confirmation email with detailed results
 */
export async function sendImportConfirmation(
  userId: string,
  result: ProcessingResult
): Promise<void> {
  const userEmail = await getUserEmail(userId);

  if (!userEmail) {
    console.error('Cannot send confirmation email - user email not found');
    return;
  }

  const subject = result.requiresReview
    ? `⚠️ ${result.flightsCreated} flight(s) added - Review needed`
    : result.flightsCreated > 0
    ? `✅ ${result.flightsCreated} flight(s) added successfully`
    : `ℹ️ No new flights added`;

  try {
    await getResend().emails.send({
      from: 'JetLag Recovery <flights@jetlagrecovery.com>',
      to: userEmail,
      subject,
      html: generateConfirmationHTML(result),
    });

    console.log('✅ Sent confirmation email to:', userEmail);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw error;
  }
}

/**
 * Generate detailed HTML for confirmation email
 */
function generateConfirmationHTML(result: ProcessingResult): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jetlagrecovery.com';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            margin: 0;
            opacity: 0.95;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 25px 0;
          }
          .stat-card {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #e5e7eb;
          }
          .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            margin: 0;
          }
          .stat-label {
            font-size: 13px;
            color: #6b7280;
            margin-top: 5px;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .flight-card {
            background: #ffffff;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .flight-card.skipped {
            border-left-color: #f59e0b;
            background: #fffbeb;
          }
          .flight-card.updated {
            border-left-color: #8b5cf6;
          }
          .flight-route {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #111827;
          }
          .flight-details {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.8;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
            margin-bottom: 5px;
          }
          .badge.success {
            background: #d1fae5;
            color: #065f46;
          }
          .badge.warning {
            background: #fef3c7;
            color: #92400e;
          }
          .badge.info {
            background: #dbeafe;
            color: #1e40af;
          }
          .review-banner {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
            text-align: center;
          }
          .review-banner h3 {
            margin: 0 0 10px 0;
            color: #92400e;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 15px;
            transition: background 0.2s;
          }
          .button:hover {
            background: #2563eb;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0;
          }
          .footer-tip {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 20px;
          }
          hr {
            margin: 30px 0;
            border: none;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>
              ${result.requiresReview ? '⚠️' : result.flightsCreated > 0 ? '✅' : 'ℹ️'}
              Import Complete
            </h1>
            <p>Processed ${result.flightsDetected} flight(s) from your email</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Summary Stats -->
            <div class="summary-grid">
              <div class="stat-card">
                <div class="stat-number">${result.flightsCreated}</div>
                <div class="stat-label">Created</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${result.flightsSkipped}</div>
                <div class="stat-label">Skipped</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${result.flightsUpdated}</div>
                <div class="stat-label">Updated</div>
              </div>
            </div>

            ${
              result.requiresReview
                ? `
              <div class="review-banner">
                <h3>⚠️ Review Required</h3>
                <p style="margin: 10px 0; color: #78350f;">
                  Some flights have low confidence and need your review to ensure accuracy.
                </p>
                <a href="${result.reviewUrl}" class="button">Review Flights Now</a>
              </div>
            `
                : ''
            }

            <!-- Created Flights -->
            ${
              result.createdFlights.length > 0
                ? `
              <h2 style="color: #111827; margin-top: 30px;">✅ Flights Added</h2>
              ${result.createdFlights
                .map(
                  (flight) => `
                <div class="flight-card">
                  <div class="flight-route">
                    ${flight.originAirportCode} → ${flight.destinationAirportCode}
                  </div>
                  <div class="flight-details">
                    ${
                      flight.airline || flight.flightNumber
                        ? `<span class="badge info">${flight.airline || ''} ${flight.flightNumber || ''}</span><br/>`
                        : ''
                    }
                    <strong>Departure:</strong> ${formatDateTime(flight.departureTime)}<br/>
                    <strong>Arrival:</strong> ${formatDateTime(flight.arrivalTime)}
                    ${flight.bookingReference ? `<br/><strong>Booking:</strong> ${flight.bookingReference}` : ''}
                    ${flight.seatNumber ? `<br/><strong>Seat:</strong> ${flight.seatNumber}` : ''}
                  </div>
                  ${
                    flight.requiresReview
                      ? `
                    <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border-radius: 6px; font-size: 12px; color: #92400e;">
                      ⚠️ Low confidence - please review
                    </div>
                  `
                      : ''
                  }
                  <a href="${appUrl}/flights/${flight.id}" style="font-size: 14px; color: #3b82f6; text-decoration: none; margin-top: 12px; display: inline-block; font-weight: 600;">
                    View recovery plan →
                  </a>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }

            <!-- Skipped Flights -->
            ${
              result.skippedFlights.length > 0
                ? `
              <h2 style="color: #111827; margin-top: 30px;">⏭️ Skipped (Duplicates)</h2>
              <p style="color: #6b7280; font-size: 14px;">
                These flights already exist in your account.
              </p>
              ${result.skippedFlights
                .map(
                  (skipped) => `
                <div class="flight-card skipped">
                  <div class="flight-route">
                    ${skipped.flight.origin} → ${skipped.flight.destination}
                  </div>
                  <div class="flight-details">
                    <span class="badge warning">Duplicate</span><br/>
                    ${skipped.reason}
                    ${
                      skipped.existingFlightId
                        ? `
                      <br/>
                      <a href="${appUrl}/flights/${skipped.existingFlightId}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                        View existing flight →
                      </a>
                    `
                        : ''
                    }
                  </div>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }

            <!-- Updated Flights -->
            ${
              result.updatedFlights.length > 0
                ? `
              <h2 style="color: #111827; margin-top: 30px;">🔄 Updated Flights</h2>
              <p style="color: #6b7280; font-size: 14px;">
                We found existing flights and updated them with new information.
              </p>
              ${result.updatedFlights
                .map(
                  (flight) => `
                <div class="flight-card updated">
                  <div class="flight-route">
                    ${flight.originAirportCode} → ${flight.destinationAirportCode}
                  </div>
                  <div class="flight-details">
                    <span class="badge success">Updated</span>
                    ${flight.flightNumber ? `<span class="badge info">${flight.flightNumber}</span>` : ''}<br/>
                    New information added to existing flight
                  </div>
                  <a href="${appUrl}/flights/${flight.id}" style="font-size: 14px; color: #3b82f6; text-decoration: none; margin-top: 12px; display: inline-block; font-weight: 600;">
                    View updated flight →
                  </a>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }

            ${
              result.errors && result.errors.length > 0
                ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <strong style="color: #991b1b;">Errors:</strong>
                <ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;">
                  ${result.errors.map((error) => `<li>${error}</li>`).join('')}
                </ul>
              </div>
            `
                : ''
            }

            <hr />

            <div style="text-align: center;">
              <a href="${appUrl}/dashboard" class="button">
                View All Flights
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">
              <strong>JetLag Recovery</strong><br/>
              Beat jet lag with science-backed recovery plans
            </p>
            <p class="footer-tip">
              💡 Tip: Forward any flight confirmation to your import email for automatic processing
            </p>
            <p class="footer-tip">
              Processing time: ${result.processingTimeMs ? Math.round(result.processingTimeMs / 1000) : 0}s
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format date/time for display
 */
function formatDateTime(dateTime: Date | string): string {
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return String(dateTime);
  }
}
