import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingResolver } from './setting.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RolePermission } from 'src/role/entities/role-permission.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting, RolePermission, User]),
    AuthModule,
  ],
  providers: [SettingResolver, SettingService, PermissionsGuard],
})
export class SettingModule {}
