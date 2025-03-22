
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../../../server/db';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  invitationToken: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, invitationToken } = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and handle invitation in a transaction
    const { user, project } = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      // If there's an invitation token, validate and handle it
      if (invitationToken) {
        const invitation = await tx.invitation.findUnique({
          where: { token: invitationToken },
        });

        if (invitation && invitation.email === email && invitation.expiresAt > new Date()) {
          // Delete the invitation since it's been used
          await tx.invitation.delete({
            where: { id: invitation.id },
          });

          // Add user to the project
          await tx.projectMember.create({
            data: {
              projectId: invitation.projectId,
              userId: user.id,
              role: 'member',
            },
          });
        }
      } else {
        // Create default project for new users without invitation
        const project = await tx.project.create({
          data: {
            name: "My First Project",
            description: "Welcome to your first project! This is where you can start managing your tasks.",
            members: {
              create: {
                userId: user.id,
                role: "owner",
              },
            },
          },
        });

        return { user, project };
      }

      return { user, project: null };
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      defaultProject: project ? {
        id: project.id,
        name: project.name,
      } : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}