import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import {
  PERMISSIONS_KEY,
  PermissionRequirement,
} from './permissions.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from 'src/role/entities/role-permission.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(RolePermission)
    private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements =
      this.reflector.getAllAndOverride<Array<PermissionRequirement | string>>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) || [];

    if (requirements.length === 0) {
      return true;
    }
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: Request & { user?: User } }>().req;

    const user = req.user;

    let roleId = user?.roleId ?? user?.role?.id;
    if (!roleId) {
      const auth = req.headers?.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (token) {
        try {
          const payload: { roleId?: unknown; sub?: unknown } =
            this.jwtService.verify(token);
          const rid = payload.roleId;
          if (typeof rid === 'string') {
            roleId = rid;
          }
          if (!roleId && typeof payload.sub === 'string') {
            const dbUser = await this.usersRepo.findOne({
              where: { id: payload.sub },
              relations: ['role'],
            });
            roleId = dbUser?.roleId ?? dbUser?.role?.id;
          }
        } catch {
          // ignore verification error; will fail below with forbidden
        }
      }
    }

    if (!roleId) {
      throw new ForbiddenException('No role assigned');
    }

    for (const requirement of requirements) {
      let moduleName: string | undefined;
      let permName: string | undefined;
      if (typeof requirement === 'string') {
        const [mod, act] = requirement.split(':');
        moduleName = mod;
        permName = act;
      } else {
        moduleName = String(requirement.module);
        permName = String(requirement.permission);
      }
      if (!moduleName || !permName) {
        throw new ForbiddenException('Invalid permission requirement');
      }
      const count = await this.rolePermRepo
        .createQueryBuilder('rp')
        .innerJoin('rp.permission', 'perm')
        .where('rp.roleId = :roleId', { roleId })
        .andWhere('perm.module = :module', { module: moduleName })
        .andWhere('perm.permission = :perm', { perm: permName })
        .getCount();

      if (count === 0) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
