import { Resend } from  "resend";

const resend = new Resend(process.env.RESEND_KEY);

export function generateSimplePassword(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export const sendWelcomeEmail = async (
  agentEmail: string,
  agentName: string,
  password: string,           // ← the plain-text temporary password
  appName: string = "Homeyhost",
  loginUrl: string = "https://homeyhost.ng/Admin-login" 
): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [agentEmail],
      subject: `Welcome to ${appName} – Your Account is Ready!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to ${appName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; }
            .greeting { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
            .password-box {
              background: #f8f9fa;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
              text-align: center;
              font-family: 'Courier New', Courier, monospace;
              font-size: 24px;
              letter-spacing: 2px;
              color: #1e293b;
            }
            .button {
              display: inline-block;
              background: #6366f1;
              color: white;
              padding: 14px 32px;
              margin: 20px 0;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
            }
            .button:hover { background: #4f46e5; }
            .footer { background: #f8f9fa; padding: 24px 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .highlight { color: #6366f1; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${appName}!</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Hi ${agentName},</div>
              
              <p>We're thrilled to have you join the ${appName} community!</p>
              
              <p>Your admin account has been successfully created. Here are your login details:</p>
              
              <div class="password-box">
                <strong>Temporary Password:</strong><br>
                ${password}
              </div>
              
              <p style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" class="button">Log in to Your Account →</a>
              </p>
              
              <p><strong>Important security note:</strong> For your account safety, please <span class="highlight">change your password</span> immediately after your first login (go to Profile → Security → Change Password).</p>
              
              <p>If you didn't create this account or have any questions, just reply to this email — we're here to help.</p>
              
              <p>Welcome aboard!<br>The ${appName} Team</p>
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
              <small>If you’re having trouble viewing this email, <a href="#">view it in your browser</a>.</small>
            </div>
          </div>
        </body>
        </html>
      `,
    });

  
  } catch (err) {
    console.error("Unexpected error sending welcome email:", err);
  }
};

export const sendRejectionMail = async (agentEmail: string, agentName: string, reason: string): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM}`, // Replace with your verified domain/sender
      to: [agentEmail],
      subject: 'Application Rejection Notice', 
      html: `
        <h2>Dear ${agentName},</h2> 
        <p>Thank you for your interest in becoming an agent with Homeyhost. After careful review, we regret to inform you that your application has not been approved at this time due to this reason.</p>
        ${reason}. <br/>
        <p>We appreciate your time and effort in applying. If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br>The Acme Team</p>
      `,
    });  
  
    if (error) {
      console.error('Failed to send rejection email:', error);
      // Optionally, throw to rollback deletion; here, we log and continue
    } else {
      console.log('Rejection email sent successfully to:', agentEmail);
    }
  } catch (err) {
    console.error('Unexpected error sending rejection email:', err);
    // Don't throw; proceed with deletion to avoid blocking  
  }
};

export const confirmPayoutMail = async (agentEmail: string, agentName: string): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM}`, // Replace with your verified domain/sender
      to: [agentEmail],
      subject: 'Successful Payout', 
      html: `
        <h2>Dear ${agentName},</h2> 
        <p>Congratulations! We are pleased to confirm that your payout has been successfully processed and the payment has been made to your account.</p>
        <p>Thank you for your continued partnership with Homeyhost. If you have any questions or need further assistance, feel free to reply to this email.</p>
        <p>Best regards,<br>The Acme Team</p>
      `,
    });  
  
    if (error) {
      console.error('Failed to send payout confirmation email:', error);
      // Optionally, throw to rollback payout; here, we log and continue
    } else {
      console.log('Payout confirmation email sent successfully to:', agentEmail);
    }
  } catch (err) {
    console.error('Unexpected error sending payout confirmation email:', err);
  }
};

export const rejectPayoutMail = async (agentEmail: string, agentName: string, reason: string): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM}`, // Replace with your verified domain/sender
      to: [agentEmail],
      subject: 'Successful Payout', 
      html: `
        <h2>Dear ${agentName},</h2> 
        <p> We regret to tell you that your payout request was rejected due to tthe reason below.</p>
        <p>Reason: ${reason}</p>
        <p>Thank you for your continued partnership with Homeyhost. If you have any questions or need further assistance, feel free to reply to this email.</p>
        <p>Best regards,<br>The Acme Team</p>
      `,
    });  
  
    if (error) {
      console.error('Failed to send payout confirmation email:', error);
      // Optionally, throw to rollback payout; here, we log and continue
    } else {
      console.log('Payout confirmation email sent successfully to:', agentEmail);
    }
  } catch (err) {
    console.error('Unexpected error sending payout confirmation email:', err);
  }
};

export const sendResetPasswordMail = async (
  userEmail: string,
  userName: string,
  resetLink: string
): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM}`,
      to: [userEmail],
      subject: 'Reset Your Password - Homeyhost',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f7fa;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 16px;
                margin-bottom: 24px;
                color: #333;
              }
              .message {
                font-size: 14px;
                line-height: 1.8;
                color: #555;
                margin-bottom: 24px;
              }
              .cta-button {
                display: inline-block;
                padding: 12px 32px;
                background: linear-gradient(135deg, #dde0ebff 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 24px 0;
                text-align: center;
                transition: transform 0.2s;
              }
              .cta-button:hover {
                transform: translateY(-2px);
              }
              .link-section {
                background-color: #f9fafb;
                padding: 16px;
                border-radius: 6px;
                margin: 24px 0;
              }
              .link-section p {
                margin: 8px 0;
                font-size: 13px;
                color: #666;
              }
              .link-section a {
                color: #667eea;
                word-break: break-all;
              }
              .warning {
                background-color: #fef3cd;
                border-left: 4px solid #ffc107;
                padding: 12px 16px;
                border-radius: 4px;
                margin: 24px 0;
                font-size: 13px;
                color: #856404;
              }
              .footer {
                background-color: #f9fafb;
                padding: 24px 30px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              .footer-link {
                color: #667eea;
                text-decoration: none;
              }
              .divider {
                height: 1px;
                background-color: #e5e7eb;
                margin: 24px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset</h1>
              </div>
              
              <div class="content">
                <div class="greeting">
                  <p>Hi ${userName},</p>
                </div>
                
                <div class="message">
                  <p>We received a request to reset the password associated with your Homeyhost account. Click the button below to securely reset your password.</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="cta-button">Reset Your Password</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> If you did not request a password reset, please ignore this email. Your account remains secure. This link will expire in 1 hour for your security.
                </div>
                
                <div class="divider"></div>
                
                <div class="link-section">
                  <p><strong>Or copy and paste this link in your browser:</strong></p>
                  <p><a href="${resetLink}">${resetLink}</a></p>
                </div>
                
                <div class="message" style="margin-top: 32px; font-size: 13px;">
                  <p>If you need any assistance, our support team is here to help. Reply to this email or visit our help center.</p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Homeyhost. All rights reserved.</p>
                <p style="margin-top: 12px; color: #999;">This is an automated message, please do not reply to this email.</p>
                <p style="margin-top: 8px;">
                  <a href="${process.env.HELP_CENTER_URL || '#'}" class="footer-link">Help Center</a> | 
                  <a href="${process.env.PRIVACY_POLICY_URL || '#'}" class="footer-link">Privacy Policy</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send reset password email:', error);
    } else {
      console.log('Reset password email sent successfully to:', userEmail);
    }
  } catch (err) {
    console.error('Unexpected error sending reset password email:', err);
  }
};