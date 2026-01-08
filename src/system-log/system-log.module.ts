import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { SystemLogResolver } from './system-log.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLog } from './entities/system-log.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RolePermission } from 'src/role/entities/role-permission.entity';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { User } from 'src/user/entities/user.entity';
import { SystemLogInterceptor } from './system-log.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemLog, RolePermission, User]),
    AuthModule,
  ],
  providers: [
    SystemLogResolver,
    SystemLogService,
    PermissionsGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: SystemLogInterceptor,
    },
  ],
})
export class SystemLogModule {}
