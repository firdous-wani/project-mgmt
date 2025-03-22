import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import bcrypt from "bcryptjs";

export const userRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("User already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        notifications: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        timezone: z.string().optional(),
        notifications: z
          .object({
            email: z.boolean(),
            push: z.boolean(),
          })
          .optional(),
        profilePictureUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          timezone: input.timezone,
          notifications: input.notifications,
          profilePictureUrl: input.profilePictureUrl,
        },
      });

      return user;
    }),
}); 