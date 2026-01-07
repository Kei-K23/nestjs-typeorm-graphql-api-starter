import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleResolver } from './role.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission])],
  providers: [RoleResolver, RoleService],
  exports: [RoleService],
})
export class RoleModule {}
