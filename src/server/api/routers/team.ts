import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Resend } from 'resend';
import { env } from "../../../env";
import { generateToken } from "../../../utils/token";

if (!env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(env.RESEND_API_KEY);

export const teamRouter = createTRPCRouter({
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    return members;
  }),

  getProjectMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.projectMember.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      return members.map(member => ({
        id: member.user.id,
        name: member.user.name ?? '',
        email: member.user.email ?? '',
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      }));
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        projectId: z.string(),
        role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already exists
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        // Get project details and project owner
        const project = await ctx.db.project.findUnique({
          where: { id: input.projectId },
        });

        if (!project) {
          throw new Error("Project not found");
        }

        const projectOwner = await ctx.db.projectMember.findFirst({
          where: {
            projectId: input.projectId,
            role: "owner",
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        if (!projectOwner) {
          throw new Error("Project owner not found");
        }

        // Check if user is already a member of the project
        if (existingUser) {
          const existingMember = await ctx.db.projectMember.findFirst({
            where: {
              projectId: input.projectId,
              userId: existingUser.id,
            },
          });

          if (existingMember) {
            throw new Error("User is already a member of this project");
          }

          // Add existing user to the project
          await ctx.db.projectMember.create({
            data: {
              projectId: input.projectId,
              userId: existingUser.id,
              role: input.role.toLowerCase(),
            },
          });

          // Send notification email to existing user
          const emailResult = await resend.emails.send({
            from: 'Project Management <onboarding@resend.dev>',
            to: input.email,
            subject: `You've been added to ${project.name}`,
            html: `
              <h2>You've been added to ${project.name}</h2>
              <p>${projectOwner.user.name ?? projectOwner.user.email} has added you to their project on Project Management.</p>
              <p>Click the button below to view the project:</p>
              <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${input.projectId}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                View Project
              </a>
              <p>If you don't want to be part of this project, you can ignore this email.</p>
            `,
          });

          console.log('Email sent successfully:', emailResult);
          return { message: "User added to project successfully" };
        }

        // Generate invitation token for new user
        const token = generateToken();

        // Create invitation record
        const invitation = await ctx.db.invitation.create({
          data: {
            email: input.email,
            token,
            projectId: input.projectId,
            invitedById: ctx.session.user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          },
        });

        // Send invitation email
        const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/auth/signup?token=${token}`;
        
        console.log('Sending email with Resend...');
        console.log('From:', 'Project Management <onboarding@resend.dev>');
        console.log('To:', input.email);
        console.log('Subject:', `Invitation to join ${project.name}`);
        console.log('URL:', inviteUrl);
        
        const emailResult = await resend.emails.send({
          from: 'Project Management <onboarding@resend.dev>',
          to: input.email,
          subject: `Invitation to join ${project.name}`,
          html: `
            <h2>You've been invited to join ${project.name}</h2>
            <p>${projectOwner.user.name ?? projectOwner.user.email} has invited you to join their project on Project Management.</p>
            <p>Click the button below to accept the invitation and create your account:</p>
            <a href="${inviteUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Accept Invitation
            </a>
            <p>This invitation will expire in 24 hours.</p>
            <p>If you don't want to accept this invitation, you can ignore this email.</p>
          `,
        });

        console.log('Email sent successfully:', emailResult);
        return { message: "Invitation sent successfully" };
      } catch (error) {
        console.error('Error in inviteMember mutation:', error);
        throw error;
      }
    }),
}); 