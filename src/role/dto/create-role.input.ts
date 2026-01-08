import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { MinLength } from 'class-validator';

@InputType()
export class CreateRoleInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  description: string;

  @Field(() => [String])
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MinLength(3, { each: true })
  permissionIds?: string[];
}
