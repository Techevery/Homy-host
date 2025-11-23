import { Resend } from  "resend";

const resend = new Resend(process.env.RESEND_KEY);

export const sendRejectionMail = async (agentEmail: string, agentName: string, reason: string): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@yourdomain.com>', // Replace with your verified domain/sender
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
      from: 'Acme <onboarding@yourdomain.com>', // Replace with your verified domain/sender
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
      from: 'Acme <onboarding@yourdomain.com>', // Replace with your verified domain/sender
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