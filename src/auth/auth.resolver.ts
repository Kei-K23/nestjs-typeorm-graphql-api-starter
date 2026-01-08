import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.type';
import { LoginInput } from './dto/login.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from './current-user.decorator';
import { SystemLog } from 'src/system-log/system-log.decorator';
import { ActivityAction } from 'src/system-log/entities/system-log.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  @SystemLog({
    action: ActivityAction.LOGIN,
    description: 'User logged in successfully',
    resourceType: 'user',
  })
  async login(@Args('loginInput') loginInput: LoginInput) {
    const { email, password } = loginInput;
    return await this.authService.login(email, password);
  }

  @Mutation(() => AuthResponse)
  @SystemLog({
    action: ActivityAction.REFRESH_TOKEN,
    description: 'User refresh token successfully',
    resourceType: 'user',
  })
  async refreshTokens(
    @Args('userId', { type: () => String }) userId: string,
    @Args('refreshToken', { type: () => String }) refreshToken: string,
  ) {
    return await this.authService.refreshTokens(userId, refreshToken);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  @SystemLog({
    action: ActivityAction.LOGOUT,
    description: 'User logged out successfully',
    resourceType: 'user',
  })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return true;
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }
}
