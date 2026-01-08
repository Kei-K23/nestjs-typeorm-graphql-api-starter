import { InputType, Field } from '@nestjs/graphql';
import { ActivityAction, SystemLogType } from '../entities/system-log.entity';

@InputType()
export class CreateSystemLogInput {
  @Field(() => String)
  userId: string;

  @Field(() => ActivityAction)
  action: ActivityAction;

  @Field(() => String)
  description: string;

  @Field(() => SystemLogType, { nullable: true })
  logType?: SystemLogType;

  @Field(() => String, { nullable: true })
  resourceType?: string;

  @Field(() => String, { nullable: true })
  resourceId?: string;

  @Field(() => String, { nullable: true })
  ipAddress?: string;

  @Field(() => String, { nullable: true })
  userAgent?: string;

  @Field(() => String, { nullable: true })
  device?: string;

  @Field(() => String, { nullable: true })
  browser?: string;

  @Field(() => String, { nullable: true })
  os?: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;
}
