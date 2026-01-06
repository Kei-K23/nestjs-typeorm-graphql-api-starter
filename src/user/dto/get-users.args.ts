import { Field, ArgsType, registerEnumType } from '@nestjs/graphql';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';

export enum UserOrderBy {
  CREATED_AT = 'createdAt',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
}

registerEnumType(UserOrderBy, { name: 'UserOrderBy' });

@ArgsType()
export class GetUsersArgs extends DefaultFilterDto {
  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => UserOrderBy, { nullable: true })
  orderBy?: UserOrderBy;
}
