import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Outbound email, over the provider's HTTPS API (Resend) — not SMTP. Render's and Railway's free
// and hobby plans block outbound SMTP ports, but ordinary HTTPS (port 443) always works.
//
// Sending needs a domain USWAG controls: Resend (like every reputable sender) delivers to other
// people only from an address on a domain verified with DNS records, because Gmail, Yahoo and
// Microsoft now reject unauthenticated mail. See backend/.env.example for the setup.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(env.email.apiKey && env.email.from);
}

/** "juan.delacruz@nwssu.edu.ph" -> "j***@nwssu.edu.ph": enough to recognise in a log, not enough to harvest. */
export function maskEmail(address: string): string {
  const at = address.indexOf('@');
  return at <= 0 ? '***' : `${address[0]}***${address.slice(at)}`;
}

/**
 * Sends one email. Never throws: a mail failure must not fail the request that triggered it, and the
 * caller (usually fire-and-forget) has nobody to tell. Returns whether the provider accepted it.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    await axios.post(
      `${env.email.apiUrl}/emails`,
      { from: env.email.from, to: [message.to], subject: message.subject, text: message.text, html: message.html },
      { headers: { Authorization: `Bearer ${env.email.apiKey}` }, timeout: 10_000 },
    );
    return true;
  } catch (err) {
    // Log the provider's reason only — never the request (it holds the reset link) or the API key.
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const reason = axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message ?? err.message : String(err);
    logger.error(`Email to ${maskEmail(message.to)} failed (${status ?? 'no response'}): ${reason}`);
    return false;
  }
}

// ─── Password reset ───────────────────────────────────────────────────────────

// Email clients can't read CSS variables, so the brand colours are written out here. They mirror
// frontend/src/styles/tokens.css (--color-deep, --color-primary, --color-mist); change them together.
const DEEP = '#142718';
const PRIMARY = '#2E5B41';
const MIST = '#E7EFE4';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The reset email: a button, the plain link as a fallback, and what to do if it wasn't them. */
export function buildPasswordResetEmail(name: string, resetUrl: string, validForMinutes: number): Omit<EmailMessage, 'to'> {
  const first = name.trim().split(/\s+/)[0] || 'there';
  const url = escapeHtml(resetUrl);
  const subject = 'Reset your USWAG password';

  const text = [
    `Hi ${first},`,
    '',
    'Someone asked to reset the password for your USWAG account. To choose a new one, open this link:',
    '',
    resetUrl,
    '',
    `The link works once and expires in ${validForMinutes} minutes.`,
    '',
    "If you didn't ask for this, you can ignore this email. Your password won't change.",
    '',
    'USWAG — United Students Working for Advocacy and Growth',
    'Northwest Samar State University',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${MIST};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MIST};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:4px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="background:${DEEP};padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px;">USWAG</td></tr>
        <tr><td style="padding:28px;color:${DEEP};font-size:16px;line-height:1.55;">
          <p style="margin:0 0 16px;">Hi ${escapeHtml(first)},</p>
          <p style="margin:0 0 24px;">Someone asked to reset the password for your USWAG account. To choose a new one, use the button below.</p>
          <p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:3px;">Choose a new password</a></p>
          <p style="margin:0 0 8px;font-size:14px;color:#4a5a50;">The link works once and expires in ${validForMinutes} minutes. If the button doesn't work, copy this address into your browser:</p>
          <p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${url}" style="color:${PRIMARY};">${url}</a></p>
          <p style="margin:0;font-size:14px;color:#4a5a50;">If you didn't ask for this, you can ignore this email. Your password won't change.</p>
        </td></tr>
        <tr><td style="background:${MIST};padding:16px 28px;font-size:12px;color:#4a5a50;">United Students Working for Advocacy and Growth &middot; Northwest Samar State University</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export function sendPasswordResetEmail(to: string, name: string, resetUrl: string, validForMinutes: number): Promise<boolean> {
  return sendEmail({ to, ...buildPasswordResetEmail(name, resetUrl, validForMinutes) });
}
