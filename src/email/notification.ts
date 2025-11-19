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