import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRoleInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => [String], { nullable: true })
  permissionIds?: string[];
}
