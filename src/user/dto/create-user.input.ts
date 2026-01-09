import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}
