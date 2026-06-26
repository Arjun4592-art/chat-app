import nodemailer from 'nodemailer'

// ── Transporter ───────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

// ── OTP generator ─────────────────────────────────────────────────────────────

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit
}

// ── Send OTP email ────────────────────────────────────────────────────────────

export async function sendOtpEmail(
  email: string,
  otp: string,
  name?: string,
): Promise<void> {
  const displayName = name ?? email.split('@')[0]

  await transporter.sendMail({
    from: `"ChatSpace" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to: email,
    subject: `${otp} is your ChatSpace verification code`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:480px;background:#ffffff;border-radius:10px;
                 border:1px solid #e8e4f3;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#6d3aed;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-family:'Poppins',Arial,sans-serif;font-weight:600;letter-spacing:-0.3px;">
                ChatSpace
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#2d1f5e;font-size:15px;font-weight:500;">
                Hi ${displayName},
              </p>
              <p style="margin:0 0 24px;color:#6b6b8a;font-size:14px;line-height:1.6;">
                Use the code below to verify your email. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <div style="background:#f5f3ff;border:1.5px dashed #b8a6f0;border-radius:8px;
                          padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:10px;
                             color:#6d3aed;font-family:'Poppins',Arial,sans-serif;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0;color:#a89ec9;font-size:12px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.
                Never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f3ff;padding:16px 32px;border-top:1px solid #e8e4f3;">
              <p style="margin:0;color:#a89ec9;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} ChatSpace. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  })
}

// ── Verify transporter (dev helper) ──────────────────────────────────────────

export async function verifyMailer(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch {
    return false
  }
}
