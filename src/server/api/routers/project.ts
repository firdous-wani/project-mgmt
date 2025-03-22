import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  // Create a new project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        status: z.enum(["active", "completed", "archived"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First, ensure the user exists
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Create the project with the user as a member
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "owner",
            },
          },
        },
      });

      return project;
    }),

  // Get all projects for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return projects;
  }),

  // Get a single project by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      return project;
    }),

  // Update a project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Project name is required").optional(),
        description: z.string().optional(),
        status: z.enum(["active", "completed", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const project = await ctx.db.project.update({
        where: {
          id,
        },
        data,
      });

      return project;
    }),

  // Delete a project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, delete all invitations associated with the project
      await ctx.db.invitation.deleteMany({
        where: {
          projectId: input.id,
        },
      });

      // Then delete the project
      const project = await ctx.db.project.delete({
        where: {
          id: input.id,
        },
      });

      return project;
    }),

  // Add a member to a project
  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.enum(["owner", "member", "viewer"]).default("member"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is an owner of the project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: "owner",
            },
          },
        },
      });

      if (!project) {
        throw new Error("You don't have permission to add members to this project");
      }

      return ctx.db.projectMember.create({
        data: {
          projectId: input.projectId,
          userId: input.userId,
          role: input.role,
        },
        include: {
          user: true,
        },
      });
    }),

  // Remove a member from a project
  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is an owner of the project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: "owner",
            },
          },
        },
      });

      if (!project) {
        throw new Error("You don't have permission to remove members from this project");
      }

      return ctx.db.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });
    }),
}); 