import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Role } from 'src/role/entities/role.entity';
import { RolePermission } from 'src/role/entities/role-permission.entity';
import { S3ClientUtils } from 'src/common/utils/s3-client.utils';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, RolePermission]), AuthModule],
  providers: [UserResolver, UserService, S3ClientUtils],
})
export class UserModule {}
