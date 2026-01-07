import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from './roles.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (!requiredRoles.length) return true;

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{
      req: Request & { user?: { role?: { title?: string } } };
    }>().req;
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException();
    }
    const roleTitle = user.role?.title;
    const ok = !!roleTitle && requiredRoles.includes(roleTitle);
    if (!ok) {
      throw new ForbiddenException();
    }
    return true;
  }
}
