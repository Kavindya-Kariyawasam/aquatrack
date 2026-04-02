import nodemailer from "nodemailer";

type ResetEmailPayload = {
  to: string;
  resetUrl: string;
};

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendPasswordResetEmail(payload: ResetEmailPayload) {
  const transport = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!transport || !from) {
    console.warn("SMTP is not configured; password reset email was not sent.");
    console.info(`Password reset URL for ${payload.to}: ${payload.resetUrl}`);
    return false;
  }

  await transport.sendMail({
    from,
    to: payload.to,
    subject: "AquaTrack Password Reset",
    text: `You requested a password reset for your AquaTrack account.\n\nUse this link within 30 minutes:\n${payload.resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin-bottom: 12px;">AquaTrack Password Reset</h2>
        <p>You requested a password reset for your AquaTrack account.</p>
        <p>
          <a href="${payload.resetUrl}" style="display:inline-block;padding:10px 16px;background:#1459c8;color:#fff;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p style="word-break: break-all;">Or open this URL directly: ${payload.resetUrl}</p>
        <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  return true;
}
