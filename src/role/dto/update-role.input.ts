import { CreateRoleInput } from './create-role.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateRoleInput extends PartialType(CreateRoleInput) {
  @Field(() => String)
  id: string;

  @Field(() => [String], { nullable: true })
  permissionIds?: string[];
}
