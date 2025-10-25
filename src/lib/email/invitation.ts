import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface InvitationEmailParams {
  toEmail: string;
  organizationName: string;
  inviterName: string;
  inviteLink: string;
  role: string;
}

export async function sendInvitationEmail({
  toEmail,
  organizationName,
  inviterName,
  inviteLink,
  role,
}: InvitationEmailParams) {
  if (!resend) {
    console.warn("Resend API key not configured. Skipping email send.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "JetLag <noreply@yourdomain.com>", // Update with your domain
      to: [toEmail],
      subject: `You're invited to join ${organizationName} on JetLag`,
      html: getInvitationEmailHTML({
        organizationName,
        inviterName,
        inviteLink,
        role,
      }),
    });

    if (error) {
      console.error("Error sending invitation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception sending invitation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

function getInvitationEmailHTML({
  organizationName,
  inviterName,
  inviteLink,
  role,
}: Omit<InvitationEmailParams, "toEmail">) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #6366F1; font-size: 28px; font-weight: 700;">
                ✈️ JetLag
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                You're invited to join a team
              </h2>

              <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join
                <strong style="color: #111827;">${organizationName}</strong> on JetLag as a
                <span style="background-color: #EEF2FF; color: #6366F1; padding: 2px 8px; border-radius: 4px; font-weight: 500;">${role}</span>.
              </p>

              <p style="margin: 0 0 30px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Join your team to coordinate travel schedules, track jetlag recovery plans, and stay synced with your colleagues across time zones.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteLink}"
                       style="display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #6366F1; word-break: break-all;">
                  ${inviteLink}
                </a>
              </p>

              <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">
                This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #F9FAFB; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                © ${new Date().getFullYear()} JetLag. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #9CA3AF; font-size: 12px;">
                Helping teams stay synchronized across time zones.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
