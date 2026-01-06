import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (!requiredRoles.length) return true;

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{
      req: Request & { user?: { role?: UserRole } };
    }>().req;
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException();
    }
    const ok = requiredRoles.includes(user.role);
    if (!ok) {
      throw new ForbiddenException();
    }
    return true;
  }
}
