import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { hasPermission, ROLES } from "@shared/permissions";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ![ROLES.OWNER, ROLES.ADMIN].includes(ctx.user.role as any)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Create a role-based procedure that checks if the user has permission
 * to perform a specific action on a resource
 */
export function roleBasedProcedure(
  resource: Parameters<typeof hasPermission>[1],
  action: string
) {
  return protectedProcedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;

      // protectedProcedure already ensures user exists, but add safety check
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบ',
        });
      }

      if (!hasPermission(ctx.user.role, resource, action)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
        });
      }

      return next({ ctx });
    })
  );
}
