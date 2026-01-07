import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async passwordHash(password: string) {
    return await argon2.hash(password);
  }

  async verifyPasswordHash(password: string, hash: string) {
    return await argon2.verify(hash, password);
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }
    return user;
  }

  async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessExpires = this.config.get<number>('JWT_EXPIRATION', 172800000);
    const refreshExpires = this.config.get<number>(
      'JWT_REFRESH_EXPIRES_IN',
      2592000000,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId ?? null,
      role: user.role?.title ?? null,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: accessExpires,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: refreshExpires,
    });

    const rtHash = await argon2.hash(refreshToken);

    await this.usersRepo.update(user.id, { refreshTokenHash: rtHash });

    return { accessToken, refreshToken };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await this.verifyPasswordHash(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }

    const ok = await argon2.verify(user.refreshTokenHash, refreshToken);

    if (!ok) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async logout(userId: string): Promise<boolean> {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
    return true;
  }
}
