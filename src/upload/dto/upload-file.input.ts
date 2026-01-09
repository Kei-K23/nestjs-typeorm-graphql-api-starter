import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class UploadFileInput {
  @Field(() => String)
  @IsString()
  fileBase64: string;

  @Field(() => String)
  @IsString()
  mimeType: string;

  @Field(() => String)
  @IsString()
  folder: string;
}
