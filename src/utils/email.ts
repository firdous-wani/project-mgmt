import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInvitationEmail = async ({
  email,
  invitedBy,
  invitationLink,
}: {
  email: string;
  invitedBy: string;
  invitationLink: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Project Management <noreply@yourdomain.com>',
      to: email,
      subject: 'You have been invited to join a project',
      html: `
        <div>
          <h1>You've been invited to join a project</h1>
          <p>${invitedBy} has invited you to join their project management team.</p>
          <p>Click the link below to accept the invitation and create your account:</p>
          <a href="${invitationLink}">Accept Invitation</a>
          <p>This invitation link will expire in 24 hours.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}; 