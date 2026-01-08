import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SMTPResponseDto {
  @Field(() => String)
  smtpHost: string;

  @Field(() => Int)
  smtpPort: number;

  @Field(() => Boolean)
  smtpSecure: boolean;

  @Field(() => String, { nullable: true })
  smtpUsername?: string;

  @Field(() => String, { nullable: true })
  smtpPassword?: string;

  @Field(() => String)
  smtpFromEmail: string;

  @Field(() => String)
  smtpFromName: string;

  @Field(() => Boolean)
  smtpEnabled: boolean;
}
