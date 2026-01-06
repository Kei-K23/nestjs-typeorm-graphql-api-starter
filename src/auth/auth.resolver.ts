import { Resolver, Mutation, Args, Query, Int } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.type';
import { LoginInput } from './dto/login.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { CurrentUser } from './current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(@Args('loginInput') loginInput: LoginInput) {
    const { email, password } = loginInput;
    return await this.authService.login(email, password);
  }

  @Mutation(() => AuthResponse)
  async refreshTokens(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('refreshToken', { type: () => String }) refreshToken: string,
  ) {
    return await this.authService.refreshTokens(userId, refreshToken);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return true;
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  me(@CurrentUser() user: User) {
    return user;
  }
}
