import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const taskRouter = createTRPCRouter({
  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        status: z.enum(["todo", "in-progress", "completed"]).default("todo"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.date().optional(),
        projectId: z.string(),
        assigneeId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user is a member of the project
      const projectMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!projectMember) {
        throw new Error("You don't have permission to create tasks in this project");
      }

      return ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
          projectId: input.projectId,
          assigneeId: input.assigneeId,
          creatorId: ctx.session.user.id,
          taskTags: input.tagIds
            ? {
                create: input.tagIds.map((tagId) => ({
                  tagId,
                })),
              }
            : undefined,
        },
        include: {
          assignee: true,
          creator: true,
          taskTags: {
            include: {
              tag: true,
            },
          },
        },
      });
    }),

  // Get all tasks for a project
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.task.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          assignee: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tasks;
    }),

  // Get a single task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findUnique({
        where: {
          id: input.id,
          project: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: {
          assignee: true,
          creator: true,
          taskTags: {
            include: {
              tag: true,
            },
          },
        },
      });
    }),

  // Update a task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Task title is required").optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
        assigneeId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tagIds, ...data } = input;

      // Check if the user is a member of the project
      const task = await ctx.db.task.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const projectMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!projectMember) {
        throw new Error("You don't have permission to update tasks in this project");
      }

      return ctx.db.task.update({
        where: { id },
        data: {
          ...data,
          taskTags: tagIds
            ? {
                deleteMany: {},
                create: tagIds.map((tagId) => ({
                  tagId,
                })),
              }
            : undefined,
        },
        include: {
          assignee: true,
          creator: true,
          taskTags: {
            include: {
              tag: true,
            },
          },
        },
      });
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the user is a member of the project
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const projectMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!projectMember) {
        throw new Error("You don't have permission to delete tasks in this project");
      }

      return ctx.db.task.delete({
        where: { id: input.id },
      });
    }),

  // Get all tasks for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.task.findMany({
      where: {
        project: {
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      },
      include: {
        assignee: true,
        creator: true,
        taskTags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }),

  getAssigned: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.task.findMany({
        where: {
          assigneeId: ctx.session.user.id,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
}); 