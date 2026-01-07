import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Role } from 'src/role/entities/role.entity';
import { RolePermission } from 'src/role/entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, RolePermission]), AuthModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
