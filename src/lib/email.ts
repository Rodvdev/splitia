import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const FROM_EMAIL = 'Splitia <onboarding@resend.dev>'; // Replace with your verified domain

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw error;
  }
}

/**
 * Send group invitation email to a user
 */
export async function sendGroupInvitationEmail({
  to,
  groupName,
  inviterName,
  inviteLink,
  isNewUser,
}: {
  to: string;
  groupName: string;
  inviterName: string;
  inviteLink: string;
  isNewUser: boolean;
}) {
  const subject = `${inviterName} invited you to join ${groupName} on Splitia`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Group Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #66e3a5;
      margin-bottom: 10px;
    }
    h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 16px;
      color: #4a5568;
    }
    .button {
      display: inline-block;
      background-color: #66e3a5;
      color: #000000;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .group-info {
      background-color: #f7fafc;
      border-left: 4px solid #66e3a5;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
    .link {
      color: #66e3a5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Splitia</div>
    </div>

    <h1>You're invited to join ${groupName}!</h1>

    <p>Hi there,</p>

    <p><strong>${inviterName}</strong> has invited you to join <strong>${groupName}</strong> on Splitia.</p>

    <div class="group-info">
      <p style="margin: 0;"><strong>Group:</strong> ${groupName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Invited by:</strong> ${inviterName}</p>
    </div>

    ${isNewUser ? `
    <p>Splitia makes it easy to split expenses with friends, family, and roommates. Track who paid what, settle up easily, and never worry about IOUs again.</p>

    <p>Click the button below to create your account and join the group:</p>
    ` : `
    <p>Click the button below to join the group:</p>
    `}

    <center>
      <a href="${inviteLink}" class="button">
        ${isNewUser ? 'Create Account & Join Group' : 'Join Group'}
      </a>
    </center>

    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
      Or copy and paste this link into your browser:<br>
      <a href="${inviteLink}" class="link">${inviteLink}</a>
    </p>

    <div class="footer">
      <p>This invitation was sent by ${inviterName} via Splitia.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${inviterName} invited you to join ${groupName} on Splitia!

Group: ${groupName}
Invited by: ${inviterName}

${isNewUser ? 'Click the link below to create your account and join the group:' : 'Click the link below to join the group:'}

${inviteLink}

---
This invitation was sent by ${inviterName} via Splitia.
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

export { resend };
