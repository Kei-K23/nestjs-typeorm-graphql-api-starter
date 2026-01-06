import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { AuthTokens } from './auth-tokens.type';

@ObjectType()
export class AuthResponse extends AuthTokens {
  @Field(() => User)
  user: User;
}
