import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from 'src/role/entities/permission.entity';
import { RolePermission } from 'src/role/entities/role-permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expires = config.get<number>('JWT_EXPIRATION', 172800000);
        return {
          secret: config.get<string>('JWT_SECRET', 'dev_jwt_secret_change_me'),
          signOptions: {
            expiresIn: expires,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([User, Permission, RolePermission]),
  ],
  providers: [AuthService, JwtStrategy, AuthResolver, PermissionsGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
