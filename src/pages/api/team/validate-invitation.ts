import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../server/db';
import { z } from 'zod';

const querySchema = z.object({
  token: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = querySchema.parse(req.query);

    // Find the invitation
    const invitation = await db.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(200).json({ email: invitation.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Invitation validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 