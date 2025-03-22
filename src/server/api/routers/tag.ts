import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const tagRouter = createTRPCRouter({
  // Create a new tag
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Tag name is required"),
        color: z.string().default("#3b82f6"), // Default blue color
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.create({
        data: {
          name: input.name,
          color: input.color,
        },
      });
    }),

  // Get all tags
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Get a single tag by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tag.findUnique({
        where: { id: input.id },
        include: {
          tasks: {
            include: {
              task: true,
            },
          },
        },
      });
    }),

  // Update a tag
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Tag name is required").optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tag.update({
        where: { id },
        data,
      });
    }),

  // Delete a tag
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.delete({
        where: { id: input.id },
      });
    }),
}); 