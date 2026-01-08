import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateSMTPSettingDto {
  @Field(() => String)
  @IsString({ message: 'SMTP host must be a string' })
  @IsNotEmpty({ message: 'SMTP host is required' })
  @MaxLength(255, { message: 'SMTP host must not exceed 255 characters' })
  smtpHost: string;

  @Field(() => Int)
  @IsNumber({}, { message: 'SMTP port must be a valid port number' })
  @Transform(({ value }) => parseInt(value))
  smtpPort: number;

  @Field(() => Boolean)
  @IsBoolean({ message: 'SMTP secure must be a boolean value' })
  @Transform(({ value }) => value === 'true' || value === true)
  smtpSecure: boolean;

  @Field(() => String)
  @IsString({ message: 'SMTP username must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'SMTP username must not exceed 255 characters' })
  smtpUsername?: string;

  @Field(() => String)
  @IsString({ message: 'SMTP password must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'SMTP password must not exceed 255 characters' })
  smtpPassword?: string;

  @Field(() => String)
  @IsEmail({}, { message: 'SMTP from email must be a valid email address' })
  @IsNotEmpty({ message: 'SMTP from email is required' })
  @MaxLength(255, { message: 'SMTP from email must not exceed 255 characters' })
  smtpFromEmail: string;

  @Field(() => String)
  @IsString({ message: 'SMTP from name must be a string' })
  @IsNotEmpty({ message: 'SMTP from name is required' })
  @MaxLength(255, { message: 'SMTP from name must not exceed 255 characters' })
  smtpFromName: string;

  @Field(() => Boolean)
  @IsBoolean({ message: 'SMTP enabled must be a boolean value' })
  @Transform(({ value }) => value === 'true' || value === true)
  smtpEnabled: boolean;
}
