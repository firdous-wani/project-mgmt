import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/[...nextauth]';
import { db } from '../../../server/db';
import { z } from 'zod';
import { sendInvitationEmail } from '../../../utils/email';
import { randomBytes } from 'crypto';

interface SessionUser {
  id: string;
  name?: string | null;
}

interface Session {
  user?: SessionUser;
}

const inviteSchema = z.object({
  email: z.string().email(),
  projectId: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = (await getServerSession(req, res, authOptions)) as Session;
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, projectId } = inviteSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if the current user is a member of the project
    const projectMember = await db.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
      },
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'You do not have permission to invite members to this project' });
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store invitation in database
    await db.invitation.create({
      data: {
        email,
        token,
        expiresAt,
        invitedById: session.user.id,
        projectId,
      },
    });

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?token=${token}`;

    // Send invitation email
    await sendInvitationEmail({
      email,
      invitedBy: session.user.name || 'A team member',
      invitationLink,
    });

    return res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Invitation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 