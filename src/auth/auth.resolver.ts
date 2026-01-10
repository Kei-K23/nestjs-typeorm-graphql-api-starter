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
import { S3ClientUtils } from 'src/common/utils/s3-client.utils';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly s3ClientUtils: S3ClientUtils,
  ) {}

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
  async me(@CurrentUser() user: User) {
    user.profilePictureUrl = user?.profilePictureUrl
      ? (await this.s3ClientUtils.generatePresignedUrl(
          user?.profilePictureUrl || '',
        )) || ''
      : '';
    return user;
  }

  @Mutation(() => Boolean)
  async requestPasswordReset(
    @Args('forgotPasswordInput')
    forgotPasswordInput: ForgotPasswordInput,
  ): Promise<boolean> {
    return await this.authService.requestPasswordReset(
      forgotPasswordInput.email,
    );
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('resetPasswordInput')
    resetPasswordInput: ResetPasswordInput,
  ): Promise<boolean> {
    const { email, code, newPassword } = resetPasswordInput;
    return await this.authService.resetPassword(email, code, newPassword);
  }

  @Mutation(() => Boolean)
  async verifyPasswordResetCode(
    @Args('email', { type: () => String }) email: string,
    @Args('code', { type: () => String }) code: string,
  ): Promise<boolean> {
    return await this.authService.verifyPasswordResetCode(email, code);
  }
}
