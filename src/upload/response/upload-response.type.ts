import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadResponse {
  @Field(() => String)
  key: string;

  @Field(() => Int)
  size: number;

  @Field(() => String)
  mimeType: string;

  @Field(() => String)
  filename: string;
}
