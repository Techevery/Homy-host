import { Resend } from  "resend";

const resend = new Resend(process.env.RESEND_KEY);

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